import {
  CreateShipmentUseCase,
  UpdateShipmentStatusUseCase,
  GetShipmentUseCase,
  TrackShipmentUseCase,
  ListCustomerShipmentsUseCase,
  GetShipmentsForInvoicingUseCase
} from '../../../application/use-cases/shipment.use-cases.js';

import { z } from 'zod';

const createShipmentSchema = z.object({
  customerId: z.number(),
  consigneeId: z.number(),
  weight: z.object({
    value: z.number().positive(),
    unit: z.enum(['kg', 'g', 'lb'])
  }),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }),
  cost: z.number().positive(),
  notes: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled',
    'returned'
  ]),
  notes: z.string().optional()
});

export class ShipmentController {
  constructor(shipmentRepository, customerRepository, consigneeRepository) {
    this.createShipmentUseCase = new CreateShipmentUseCase(
      shipmentRepository,
      customerRepository,
      consigneeRepository
    );
    this.updateShipmentStatusUseCase = new UpdateShipmentStatusUseCase(shipmentRepository);
    this.getShipmentUseCase = new GetShipmentUseCase(shipmentRepository);
    this.trackShipmentUseCase = new TrackShipmentUseCase(shipmentRepository);
    this.listCustomerShipmentsUseCase = new ListCustomerShipmentsUseCase(
      shipmentRepository,
      customerRepository
    );
    this.getShipmentsForInvoicingUseCase = new GetShipmentsForInvoicingUseCase(shipmentRepository);
  }

  async createShipment(req, res) {
    try {
      const parse = createShipmentSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: parse.error.flatten()
        });
      }

      const shipment = await this.createShipmentUseCase.execute(parse.data);
      res.status(201).json(shipment);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('not active')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Create shipment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const parse = updateStatusSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: parse.error.flatten()
        });
      }

      const shipment = await this.updateShipmentStatusUseCase.execute(
        parseInt(id),
        parse.data.status,
        parse.data.notes
      );
      res.json(shipment);
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Invalid status')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Update shipment status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getShipment(req, res) {
    try {
      const { id } = req.params;
      const shipment = await this.getShipmentUseCase.execute(parseInt(id));
      res.json(shipment);
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get shipment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async trackShipment(req, res) {
    try {
      const { trackingNumber } = req.params;
      const shipment = await this.trackShipmentUseCase.execute(trackingNumber);
      res.json(shipment);
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Track shipment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async listCustomerShipments(req, res) {
    try {
      const { customerId } = req.params;
      const { status } = req.query;
      
      const filters = status ? { status } : {};
      const shipments = await this.listCustomerShipmentsUseCase.execute(
        parseInt(customerId),
        filters
      );
      res.json(shipments);
    } catch (error) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('List customer shipments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getShipmentsForInvoicing(req, res) {
    try {
      const { customerId } = req.params;
      const shipments = await this.getShipmentsForInvoicingUseCase.execute(
        parseInt(customerId)
      );
      res.json(shipments);
    } catch (error) {
      console.error('Get shipments for invoicing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}