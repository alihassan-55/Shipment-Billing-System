import { prisma } from '../db/client.js';
import { ShipmentInvoiceService } from '../services/shipmentInvoiceService.js';

/**
 * Generate invoices for a shipment
 * POST /api/shipments/:id/generate-invoices
 */
export async function generateShipmentInvoices(req, res) {
  const { id } = req.params;

  try {
    const invoices = await ShipmentInvoiceService.createForShipment(id);

    return res.json({
      success: true,
      invoices: {
        declaredValueInvoice: invoices.declaredValueInvoice,
        billingInvoice: invoices.billingInvoice
      }
    });
  } catch (error) {
    console.error('Error generating shipment invoices:', error);
    return res.status(500).json({ 
      error: 'Failed to generate invoices: ' + error.message 
    });
  }
}

/**
 * Get invoices for a shipment
 * GET /api/shipments/:id/invoices
 */
export async function getShipmentInvoices(req, res) {
  const { id } = req.params;

  try {
    const invoices = await ShipmentInvoiceService.getShipmentInvoices(id);

    return res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Error fetching shipment invoices:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch invoices: ' + error.message 
    });
  }
}

/**
 * Generate PDF for a specific invoice
 * POST /api/invoices/:id/pdf
 */
export async function generateInvoicePDF(req, res) {
  const { id } = req.params;

  try {
    const pdfPath = await ShipmentInvoiceService.regeneratePDF(id);

    return res.json({
      success: true,
      pdfPath,
      message: 'PDF generated successfully'
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return res.status(500).json({ 
      error: 'Failed to generate PDF: ' + error.message 
    });
  }
}

/**
 * Get invoice details
 * GET /api/invoices/:id
 */
export async function getInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.shipment_invoices.findUnique({
      where: { id },
      include: {
        shipments: {
          include: {
            shippers: true,
            consignees: true,
            service_providers: true,
            product_invoice_items: true,
            shipment_boxes: true
          }
        },
        lineItems: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch invoice: ' + error.message 
    });
  }
}

/**
 * Update invoice status
 * PATCH /api/invoices/:id/status
 */
export async function updateInvoiceStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'UNPAID', 'PARTIAL', 'PAID'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
    });
  }

  try {
    const invoice = await prisma.shipment_invoices.update({
      where: { id },
      data: { status },
      include: {
        lineItems: true
      }
    });

    return res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    return res.status(500).json({ 
      error: 'Failed to update invoice status: ' + error.message 
    });
  }
}


