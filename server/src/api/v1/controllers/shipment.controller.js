import { z } from 'zod';

const createShipmentSchema = z.object({
  customerId: z.number(),
  consigneeId: z.number(),
  weight: z.number().positive(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }),
  cost: z.number().positive(),
  notes: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled'])
});

export class ShipmentController {
  constructor(shipmentService) {
    this.shipmentService = shipmentService;
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

      const shipment = await this.shipmentService.createShipment(parse.data);
      res.status(201).json(shipment);
    } catch (error) {
      if (error.message === 'Customer not found' || error.message === 'Consignee not found') {
        return res.status(404).json({ error: error.message });
      }
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

      const shipment = await this.shipmentService.updateShipmentStatus(
        parseInt(id), 
        parse.data.status
      );
      res.json(shipment);
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Invalid status') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCustomerShipments(req, res) {
    try {
      const { customerId } = req.params;
      const shipments = await this.shipmentService.getShipmentsByCustomer(
        parseInt(customerId)
      );
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getInvoiceableShipments(req, res) {
    try {
      const { customerId } = req.params;
      const shipments = await this.shipmentService.getShipmentsForInvoicing(
        parseInt(customerId)
      );
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}