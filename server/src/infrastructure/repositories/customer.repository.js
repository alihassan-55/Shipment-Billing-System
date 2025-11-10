import { Customer } from '../../domain/entities/customer.entity.js';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface.js';

export class CustomerRepository extends ICustomerRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
  }

  async create(customer) {
    const data = customer.toJSON();
    delete data.id;
    
    const created = await this.prisma.customer.create({
      data
    });

    return new Customer(created);
  }

  async findById(id) {
    const customer = await this.prisma.customer.findUnique({
      where: { id }
    });

    return customer ? new Customer(customer) : null;
  }

  async findByEmail(email) {
    const customer = await this.prisma.customer.findUnique({
      where: { email }
    });

    return customer ? new Customer(customer) : null;
  }

  async update(customer) {
    const data = customer.toJSON();
    
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data
    });

    return new Customer(updated);
  }

  async delete(id) {
    await this.prisma.customer.delete({
      where: { id }
    });
  }

  async findAll(filters = {}) {
    const customers = await this.prisma.customer.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return customers.map(customer => new Customer(customer));
  }

  async findByStatus(status) {
    const customers = await this.prisma.customer.findMany({
      where: { status },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return customers.map(customer => new Customer(customer));
  }
}