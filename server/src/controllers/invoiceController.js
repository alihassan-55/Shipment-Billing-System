import { prisma } from '../db/client.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

export async function createInvoice(req, res) {
  const { shipmentIds, customerId, issuedDate, dueDate, taxRate = 0.18 } = req.body;

  if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
    return res.status(400).json({ error: 'Shipment IDs required' });
  }

  if (!customerId) return res.status(400).json({ error: 'Customer ID required' });

  try {
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify shipments exist and are not already invoiced
      const shipments = await tx.shipment.findMany({
        where: {
          id: { in: shipmentIds },
          invoiceId: null, // Not already invoiced
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      if (shipments.length !== shipmentIds.length) {
        throw new Error('Some shipments not found or already invoiced');
      }

      // Generate invoice number
      const invoiceCount = await tx.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(6, '0')}`;

      // Calculate totals
      let subtotal = 0;
      const lineItems = shipments.map((shipment) => {
        // Simple pricing: $10 base + $2 per kg
        const shipmentCharge = 10 + (shipment.weight * 2);
        const insurance = shipment.declaredValue ? shipment.declaredValue * 0.01 : 0;
        const codFee = shipment.codAmount ? shipment.codAmount * 0.02 : 0;
        const lineTotal = shipmentCharge + insurance + codFee;
        
        subtotal += lineTotal;

        return {
          shipmentId: shipment.id,
          description: `${shipment.serviceType} - ${shipment.waybill}`,
          quantity: 1,
          unitPrice: lineTotal,
          total: lineTotal,
        };
      });

      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal,
          tax,
          total,
          status: 'Unpaid',
          lineItems: {
            create: lineItems,
          },
        },
        include: {
          customer: true,
          lineItems: {
            include: {
              shipment: {
                include: {
                  sender: true,
                  receiver: true,
                },
              },
            },
          },
        },
      });

      // Update shipments to link to invoice
      await tx.shipment.updateMany({
        where: { id: { in: shipmentIds } },
        data: { invoiceId: invoice.id },
      });

      return invoice;
    });

    // Queue PDF generation (async)
    generateInvoicePDF(result.id).catch(console.error);

    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Failed to create invoice' });
  }
}

export async function getInvoices(req, res) {
  const {
    customerId,
    status,
    from,
    to,
    page = 1,
    limit = 20,
  } = req.query;

  const where = {};
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  if (from || to) {
    where.issuedDate = {};
    if (from) where.issuedDate.gte = new Date(from);
    if (to) where.issuedDate.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: true,
          lineItems: {
            include: {
              shipment: true,
            },
          },
          payments: true,
        },
        orderBy: { issuedDate: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}

export async function getInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            shipment: {
              include: {
                sender: true,
                receiver: true,
                events: { orderBy: { occurredAt: 'desc' } },
              },
            },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Calculate payment summary
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = invoice.total - totalPaid;

    return res.json({
      ...invoice,
      paymentSummary: {
        total: invoice.total,
        paid: totalPaid,
        outstanding,
        status: outstanding <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}

export async function generateInvoicePDFEndpoint(req, res) {
  const { id } = req.params;

  try {
    console.log(`Generating PDF for invoice: ${id}`);
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            shipment: true,
          },
        },
      },
    });

    if (!invoice) {
      console.log(`Invoice not found: ${id}`);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    console.log(`Found invoice: ${invoice.invoiceNumber}`);

    // Generate PDF
    const pdfPath = await generateInvoicePDF(id);
    console.log(`PDF generated at: ${pdfPath}`);
    
    // Update invoice with PDF path
    await prisma.invoice.update({
      where: { id },
      data: { pdfPath },
    });

    // Send the PDF file with CORS headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    const fs = await import('fs/promises');
    const pdfBuffer = await fs.readFile(pdfPath);
    console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);
    
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}


