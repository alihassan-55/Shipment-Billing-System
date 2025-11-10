import { AggregateRoot } from './base.entity.js';

export class Customer extends AggregateRoot {
  constructor(props) {
    super(props.id);
    this.name = props.name;
    this.email = props.email;
    this.phone = props.phone;
    this.address = props.address;
    this.cnic = props.cnic;
    this.ntn = props.ntn;
    this.creditLimit = props.creditLimit;
    this.status = props.status || 'active';
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  updateDetails(details) {
    Object.assign(this, {
      ...details,
      updatedAt: new Date()
    });
  }

  deactivate() {
    this.status = 'inactive';
    this.updatedAt = new Date();
  }

  activate() {
    this.status = 'active';
    this.updatedAt = new Date();
  }

  isActive() {
    return this.status === 'active';
  }

  validateCreditLimit(amount) {
    return this.creditLimit >= amount;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      cnic: this.cnic,
      ntn: this.ntn,
      creditLimit: this.creditLimit,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static create(props) {
    const customer = new Customer(props);
    customer.addDomainEvent({
      type: 'CustomerCreated',
      customer: customer.toJSON()
    });
    return customer;
  }
}