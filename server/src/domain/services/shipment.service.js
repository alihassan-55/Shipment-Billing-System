import { ShipmentSchema, ShipmentStatus } from '../entities/shipment.entity.js';

export class ShipmentService {
  constructor(shipmentRepository, customerRepository, consigneeRepository) {
    this.shipmentRepository = shipmentRepository;
    this.customerRepository = customerRepository;
    this.consigneeRepository = consigneeRepository;
  }

  async createShipment(shipmentData) {
    const data = ShipmentSchema.parse(shipmentData);
    
    // Verify customer exists
    const customer = await this.customerRepository.findById(data.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify consignee exists
    const consignee = await this.consigneeRepository.findById(data.consigneeId);
    if (!consignee) {
      throw new Error('Consignee not found');
    }

    // Generate tracking number
    data.trackingNumber = await this._generateTrackingNumber();

    return this.shipmentRepository.create(data);
  }

  async updateShipmentStatus(id, status) {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    if (!Object.values(ShipmentStatus).includes(status)) {
      throw new Error('Invalid status');
    }

    return this.shipmentRepository.update(id, { status });
  }

  async getShipmentsByCustomer(customerId, filters = {}) {
    return this.shipmentRepository.findByCustomer(customerId, filters);
  }

  async getShipmentsForInvoicing(customerId) {
    return this.shipmentRepository.findByCustomerAndStatus(
      customerId,
      ShipmentStatus.DELIVERED
    );
  }

  async _generateTrackingNumber() {
    const prefix = 'CBS';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}