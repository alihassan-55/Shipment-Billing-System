import { 
  CreateCustomerUseCase,
  UpdateCustomerUseCase,
  GetCustomerUseCase,
  ListCustomersUseCase,
  DeactivateCustomerUseCase
} from '../../../application/use-cases/customer.use-cases.js';

export class CustomerController {
  constructor(customerRepository) {
    this.createCustomerUseCase = new CreateCustomerUseCase(customerRepository);
    this.updateCustomerUseCase = new UpdateCustomerUseCase(customerRepository);
    this.getCustomerUseCase = new GetCustomerUseCase(customerRepository);
    this.listCustomersUseCase = new ListCustomersUseCase(customerRepository);
    this.deactivateCustomerUseCase = new DeactivateCustomerUseCase(customerRepository);
  }

  async createCustomer(req, res) {
    try {
      const customer = await this.createCustomerUseCase.execute(req.body);
      res.status(201).json(customer);
    } catch (error) {
      if (error.message === 'Customer with this email already exists') {
        res.status(409).json({ error: error.message });
      } else {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateCustomer(req, res) {
    try {
      const customer = await this.updateCustomerUseCase.execute(
        parseInt(req.params.id),
        req.body
      );
      res.json(customer);
    } catch (error) {
      if (error.message === 'Customer not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Customer with this email already exists') {
        res.status(409).json({ error: error.message });
      } else {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getCustomer(req, res) {
    try {
      const customer = await this.getCustomerUseCase.execute(parseInt(req.params.id));
      res.json(customer);
    } catch (error) {
      if (error.message === 'Customer not found') {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async listCustomers(req, res) {
    try {
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      
      const customers = await this.listCustomersUseCase.execute(filters);
      res.json(customers);
    } catch (error) {
      console.error('List customers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deactivateCustomer(req, res) {
    try {
      const customer = await this.deactivateCustomerUseCase.execute(parseInt(req.params.id));
      res.json(customer);
    } catch (error) {
      if (error.message === 'Customer not found') {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Deactivate customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}