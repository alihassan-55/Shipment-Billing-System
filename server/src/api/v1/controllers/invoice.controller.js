import { z } from 'zod';

const createInvoiceSchema = z.object({
  customerId: z.number(),
  shipmentIds: z.array(z.number()),
  notes: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'cancelled', 'overdue'])
});

export class InvoiceController {
  constructor(invoiceService) {
    this.invoiceService = invoiceService;
  }

  async createInvoice(req, res) {
    try {
      const parse = createInvoiceSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: parse.error.flatten() 
        });
      }

      const invoice = await this.invoiceService.createInvoice(parse.data);
      res.status(201).json(invoice);
    } catch (error) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('shipments')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Invoice creation error:', error);
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

      const invoice = await this.invoiceService.updateInvoiceStatus(
        parseInt(id), 
        parse.data.status
      );
      res.json(invoice);
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Invalid status' || 
          error.message.includes('cancelled') || 
          error.message.includes('paid')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Invoice status update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCustomerInvoices(req, res) {
    try {
      const { customerId } = req.params;
      const { status } = req.query;
      
      const filters = status ? { status } : {};
      const invoices = await this.invoiceService.getCustomerInvoices(
        parseInt(customerId),
        filters
      );
      res.json(invoices);
    } catch (error) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get customer invoices error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getInvoiceDetails(req, res) {
    try {
      const { id } = req.params;
      const invoice = await this.invoiceService.getInvoiceDetails(parseInt(id));
      res.json(invoice);
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get invoice details error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}