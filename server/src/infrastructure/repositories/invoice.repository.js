import { Invoice } from '../../domain/entities/invoice.entity.js';

export class InvoiceRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(invoiceData) {
    const invoice = await this.prisma.invoice.create({
      data: {
        ...invoiceData,
        shipmentIds: JSON.stringify(invoiceData.shipmentIds),
        dueDate: new Date(invoiceData.dueDate)
      }
    });
    return new Invoice({
      ...invoice,
      shipmentIds: JSON.parse(invoice.shipmentIds),
      dueDate: new Date(invoice.dueDate)
    });
  }

  async findById(id) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id }
    });
    if (!invoice) return null;
    
    return new Invoice({
      ...invoice,
      shipmentIds: JSON.parse(invoice.shipmentIds),
      dueDate: new Date(invoice.dueDate)
    });
  }

  async update(id, data) {
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        shipmentIds: data.shipmentIds ? JSON.stringify(data.shipmentIds) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    });
    return new Invoice({
      ...invoice,
      shipmentIds: JSON.parse(invoice.shipmentIds),
      dueDate: new Date(invoice.dueDate)
    });
  }

  async findByCustomer(customerId, filters = {}) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        customerId,
        ...filters
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return invoices.map(invoice => new Invoice({
      ...invoice,
      shipmentIds: JSON.parse(invoice.shipmentIds),
      dueDate: new Date(invoice.dueDate)
    }));
  }

  async findLastInvoice() {
    const invoice = await this.prisma.invoice.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!invoice) return null;

    return new Invoice({
      ...invoice,
      shipmentIds: JSON.parse(invoice.shipmentIds),
      dueDate: new Date(invoice.dueDate)
    });
  }
}