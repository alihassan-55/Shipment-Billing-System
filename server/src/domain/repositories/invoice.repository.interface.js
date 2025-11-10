export class InvoiceRepositoryInterface {
  async create(invoice) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByNumber(number) {
    throw new Error('Method not implemented');
  }

  async findByCustomer(customerId, filters = {}) {
    throw new Error('Method not implemented');
  }

  async update(invoice) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findOverdue() {
    throw new Error('Method not implemented');
  }

  async generateInvoiceNumber() {
    throw new Error('Method not implemented');
  }
}