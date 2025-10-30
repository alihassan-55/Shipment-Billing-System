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
 * GET /api/invoices/:id/pdf
 */
export async function generateInvoicePDF(req, res) {
  const { id } = req.params;

  try {
    const pdfPath = await ShipmentInvoiceService.regeneratePDF(id);

    // Read the PDF file and send it as a response
    const fs = await import('fs');
    const path = await import('path');
    
    const fullPath = path.resolve(pdfPath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    
    // Send the PDF file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
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

  console.log('updateInvoiceStatus called with:', { id, status });

  const validStatuses = ['DRAFT', 'UNPAID', 'PARTIAL', 'PAID', 'ADD_TO_LEDGER'];
  if (!validStatuses.includes(status)) {
    console.log('Invalid status:', status);
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
    });
  }

  try {
    const invoice = await prisma.shipment_invoices.findUnique({
      where: { id },
      include: {
        lineItems: true
      }
    });

    console.log('Found invoice:', invoice ? 'Yes' : 'No');

    if (!invoice) {
      console.log('Invoice not found for id:', id);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update the invoice status
    const updatedInvoice = await prisma.shipment_invoices.update({
      where: { id },
      data: { status },
      include: {
        lineItems: true
      }
    });

    // If status is "ADD_TO_LEDGER", create a ledger entry
    if (status === 'ADD_TO_LEDGER') {
      const totalAmount = invoice.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      await prisma.ledger_entries.create({
        data: {
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          type: 'INVOICE',
          amount: totalAmount,
          description: `Invoice #${invoice.invoiceNumber} - Customer ID: ${invoice.customerId}`,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    return res.json({
      success: true,
      invoice: updatedInvoice
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


