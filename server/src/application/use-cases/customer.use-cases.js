import { Customer } from '../../domain/entities/customer.entity.js';

export class CreateCustomerUseCase {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(customerData) {
    // Check if customer with email already exists
    const existingCustomer = await this.customerRepository.findByEmail(customerData.email);
    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    // Create new customer entity
    const customer = Customer.create(customerData);

    // Save to repository
    const savedCustomer = await this.customerRepository.create(customer);

    return savedCustomer;
  }
}

export class UpdateCustomerUseCase {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(id, customerData) {
    // Find existing customer
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // If email is being changed, check for duplicates
    if (customerData.email && customerData.email !== customer.email) {
      const existingCustomer = await this.customerRepository.findByEmail(customerData.email);
      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }
    }

    // Update customer details
    customer.updateDetails(customerData);

    // Save updated customer
    const updatedCustomer = await this.customerRepository.update(customer);

    return updatedCustomer;
  }
}

export class GetCustomerUseCase {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(id) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }
}

export class ListCustomersUseCase {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(filters = {}) {
    return this.customerRepository.findAll(filters);
  }
}

export class DeactivateCustomerUseCase {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(id) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.deactivate();
    return this.customerRepository.update(customer);
  }
}