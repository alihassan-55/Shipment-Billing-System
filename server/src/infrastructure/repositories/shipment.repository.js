import { Shipment } from '../../domain/entities/shipment.entity.js';

export class ShipmentRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(shipmentData) {
    const shipment = await this.prisma.shipment.create({
      data: {
        ...shipmentData,
        dimensions: JSON.stringify(shipmentData.dimensions)
      }
    });
    return new Shipment({
      ...shipment,
      dimensions: JSON.parse(shipment.dimensions)
    });
  }

  async findById(id) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id }
    });
    if (!shipment) return null;
    
    return new Shipment({
      ...shipment,
      dimensions: JSON.parse(shipment.dimensions)
    });
  }

  async update(id, data) {
    const shipment = await this.prisma.shipment.update({
      where: { id },
      data: {
        ...data,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : undefined
      }
    });
    return new Shipment({
      ...shipment,
      dimensions: JSON.parse(shipment.dimensions)
    });
  }

  async findByCustomer(customerId, filters = {}) {
    const shipments = await this.prisma.shipment.findMany({
      where: {
        customerId,
        ...filters
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return shipments.map(shipment => new Shipment({
      ...shipment,
      dimensions: JSON.parse(shipment.dimensions)
    }));
  }

  async findByCustomerAndStatus(customerId, status) {
    return this.findByCustomer(customerId, { status });
  }
}