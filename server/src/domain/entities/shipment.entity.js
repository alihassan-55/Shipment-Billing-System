import { z } from 'zod';

export const ShipmentStatus = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const ShipmentSchema = z.object({
  id: z.number().optional(),
  trackingNumber: z.string(),
  customerId: z.number(),
  consigneeId: z.number(),
  weight: z.number().positive(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }),
  status: z.enum([
    ShipmentStatus.PENDING,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED
  ]).default(ShipmentStatus.PENDING),
  cost: z.number().positive(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export class Shipment {
  constructor(data) {
    Object.assign(this, ShipmentSchema.parse(data));
  }

  calculateVolume() {
    return this.dimensions.length * this.dimensions.width * this.dimensions.height;
  }

  canBeInvoiced() {
    return this.status === ShipmentStatus.DELIVERED;
  }

  toJSON() {
    return {
      ...this,
      volume: this.calculateVolume()
    };
  }
}