export class IShipmentRepository {
  async create(shipment) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByTrackingNumber(trackingNumber) {
    throw new Error('Method not implemented');
  }

  async update(shipment) {
    throw new Error('Method not implemented');
  }

  async findByCustomer(customerId, filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findUnassignedDelivered(customerId) {
    throw new Error('Method not implemented');
  }

  async findByInvoice(invoiceId) {
    throw new Error('Method not implemented');
  }

  async assignToInvoice(shipmentIds, invoiceId) {
    throw new Error('Method not implemented');
  }
}