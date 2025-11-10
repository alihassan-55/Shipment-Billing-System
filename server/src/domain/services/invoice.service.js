import { InvoiceSchema, InvoiceStatus } from '../entities/invoice.entity.js';
import { ShipmentStatus } from '../entities/shipment.entity.js';

export class InvoiceService {
  constructor(invoiceRepository, shipmentRepository, customerRepository) {
    this.invoiceRepository = invoiceRepository;
    this.shipmentRepository = shipmentRepository;
    this.customerRepository = customerRepository;
  }

  async createInvoice(invoiceData) {
    const { shipmentIds, customerId, ...rest } = InvoiceSchema.parse(invoiceData);

    // Verify customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify all shipments exist and belong to the customer
    const shipments = await Promise.all(
      shipmentIds.map(id => this.shipmentRepository.findById(id))
    );

    if (shipments.some(s => !s)) {
      throw new Error('One or more shipments not found');
    }

    if (shipments.some(s => s.customerId !== customerId)) {
      throw new Error('One or more shipments do not belong to this customer');
    }

    if (shipments.some(s => s.status !== ShipmentStatus.DELIVERED)) {
      throw new Error('All shipments must be delivered before invoicing');
    }

    // Generate invoice number
    const invoiceNumber = await this._generateInvoiceNumber();

    // Calculate totals
    const subtotal = shipments.reduce((sum, s) => sum + s.cost, 0);
    const tax = subtotal * 0.15; // 15% tax rate
    const total = subtotal + tax;

    // Set due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.invoiceRepository.create({
      ...rest,
      invoiceNumber,
      customerId,
      shipmentIds,
      subtotal,
      tax,
      total,
      dueDate
    });
  }

  async updateInvoiceStatus(id, status) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!Object.values(InvoiceStatus).includes(status)) {
      throw new Error('Invalid status');
    }

    // Validate status transitions
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot update cancelled invoice');
    }

    if (invoice.status === InvoiceStatus.PAID && status !== InvoiceStatus.CANCELLED) {
      throw new Error('Paid invoice can only be cancelled');
    }

    return this.invoiceRepository.update(id, { status });
  }

  async getCustomerInvoices(customerId, filters = {}) {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.invoiceRepository.findByCustomer(customerId, filters);
  }

  async getInvoiceDetails(id) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const shipments = await Promise.all(
      invoice.shipmentIds.map(id => this.shipmentRepository.findById(id))
    );

    return {
      ...invoice.toJSON(),
      shipments: shipments.map(s => s.toJSON())
    };
  }

  async _generateInvoiceNumber() {
    const prefix = 'INV';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const lastInvoice = await this.invoiceRepository.findLastInvoice();
    const sequence = lastInvoice ? 
      (parseInt(lastInvoice.invoiceNumber.slice(-4)) + 1).toString().padStart(4, '0') : 
      '0001';
    return `${prefix}${date}${sequence}`;
  }
}