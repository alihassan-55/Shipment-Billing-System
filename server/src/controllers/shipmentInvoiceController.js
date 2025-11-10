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
        return res.status(500).json({ error: 'Failed to generate invoices: ' + error.message });
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
        return res.json({ success: true, invoices });
    } catch (error) {
        console.error('Error fetching shipment invoices:', error);
        return res.status(500).json({ error: 'Failed to fetch invoices: ' + error.message });
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

        return res.json({ success: true, invoice });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return res.status(500).json({ error: 'Failed to fetch invoice: ' + error.message });
    }
}

/**
 * Generate PDF for a specific invoice
 * POST /api/invoices/:id/generate-pdf
 */
export async function generateInvoicePDF(req, res) {
    const { id } = req.params;

    try {
        // Generate PDF
        console.log('Generating PDF for invoice:', id);
        const pdfPath = await ShipmentInvoiceService.regeneratePDF(id);
        console.log('PDF generated at:', pdfPath);

        // Read the PDF file
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        // Convert relative path to absolute
        const absolutePdfPath = path.join(__dirname, '../../', pdfPath.startsWith('/') ? pdfPath.slice(1) : pdfPath);
        console.log('Reading PDF from:', absolutePdfPath);

        // Read and send PDF
        try {
            const pdfBuffer = await fs.readFile(absolutePdfPath);
            console.log('PDF size:', pdfBuffer.length, 'bytes');

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src *; img-src 'self' blob: data:; object-src 'self' blob:;");
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            
            return res.send(pdfBuffer);
        } catch (readError) {
            console.error('Error reading PDF:', readError);
            return res.status(404).json({ error: 'PDF file not found' });
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        return res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
    }
}

/**
 * Update invoice status
 * PATCH /api/invoices/:id/status
 */
export async function updateInvoiceStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Updating invoice status:', { id, status });

    const validStatuses = ['DRAFT', 'UNPAID', 'PARTIAL', 'PAID', 'ADD_TO_LEDGER'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        });
    }

    try {
        const invoice = await prisma.shipment_invoices.findUnique({
            where: { id },
            include: { 
                shipments: true,
                lineItems: true 
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (status === 'ADD_TO_LEDGER') {
            if (invoice.postedLedgerEntryId) {
                return res.status(400).json({
                    error: 'Invoice has already been posted to ledger'
                });
            }

            // Create ledger entry
            const ledgerEntry = await prisma.ledger_entries.create({
                data: {
                    customerId: invoice.shipments.customerId,
                    description: `Invoice ${invoice.invoiceNumber} - ${invoice.type}`,
                    debit: invoice.total,
                    credit: 0
                }
            });

            // Update invoice with ledger reference
            await prisma.shipment_invoices.update({
                where: { id },
                data: { 
                    postedLedgerEntryId: ledgerEntry.id,
                    status: 'UNPAID'
                }
            });

            return res.json({ 
                success: true,
                message: 'Invoice posted to ledger',
                ledgerEntry
            });
        }

        // Regular status update
        await prisma.shipment_invoices.update({
            where: { id },
            data: { status }
        });

        return res.json({ 
            success: true,
            message: 'Invoice status updated'
        });

    } catch (error) {
        console.error('Error updating invoice status:', error);
        return res.status(500).json({ 
            error: 'Failed to update invoice status: ' + error.message 
        });
    }
}