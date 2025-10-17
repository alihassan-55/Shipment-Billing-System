// File: invoiceController.js
// Purpose: Enhanced invoice management with automatic generation and payment tracking
// Dependencies: prisma client, pdfGenerator, ledgerService

import { prisma } from '../db/client.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import crypto from 'crypto';

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
          lineItems: true,
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
        status: outstanding <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}

export async function generateInvoicePDFEndpoint(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Generate PDF (this would typically be queued)
    const pdfPath = await generateInvoicePDF(id);
    
    // Update invoice with PDF path
    await prisma.invoice.update({
      where: { id },
      data: { pdfPath },
    });

    return res.json({ pdfPath, message: 'PDF generated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

/**
 * Automatically create invoice for a customer from confirmed shipments
 */
export async function createInvoiceFromShipments(req, res) {
  const { customerId, shipmentIds, taxRate = 0.18 } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get customer
      const customer = await tx.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get shipments to invoice
      const shipments = await tx.shipments.findMany({
        where: {
          id: shipmentIds ? { in: shipmentIds } : undefined,
          customerId,
          status: 'CONFIRMED'
        },
        include: {
          billing_invoices: true,
          product_invoice_items: true
        }
      });

      if (shipments.length === 0) {
        throw new Error('No confirmed shipments found for this customer');
      }

      // Check if customer has existing draft invoice
      let invoice = await tx.invoice.findFirst({
        where: {
          customerId,
          status: 'DRAFT'
        },
        include: {
          lineItems: true
        }
      });

      if (!invoice) {
        // Create new invoice
        const invoiceNumber = await generateInvoiceNumber();
        
        invoice = await tx.invoice.create({
          data: {
            id: crypto.randomUUID(),
            invoiceNumber,
            customerId,
            issuedDate: new Date(),
            subtotal: 0,
            tax: 0,
            total: 0,
            amountPaid: 0,
            balanceDue: 0,
            status: 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            lineItems: true
          }
        });
      }

      // Add shipments to invoice
      let totalAmount = 0;
      for (const shipment of shipments) {
        const shipmentAmount = shipment.billing_invoices?.grandTotal || 0;
        
        // Create line item for shipment
        await tx.invoiceLineItem.create({
          data: {
            id: crypto.randomUUID(),
            invoiceId: invoice.id,
            description: `Shipment ${shipment.referenceNumber}`,
            quantity: 1,
            unitPrice: shipmentAmount,
            total: shipmentAmount
          }
        });

        totalAmount += shipmentAmount;
      }

      // Update invoice totals
      const tax = totalAmount * taxRate;
      const grandTotal = totalAmount + tax;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: totalAmount,
          tax,
          total: grandTotal,
          balanceDue: grandTotal,
          updatedAt: new Date()
        },
        include: {
          customer: true,
          lineItems: true,
          payments: true
        }
      });

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          referenceId: invoice.id,
          entryType: 'INVOICE',
          description: `Invoice ${invoice.invoiceNumber} created`,
          debit: grandTotal,
          credit: 0,
          balanceAfter: customer.ledgerBalance + grandTotal,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update customer ledger balance
      await tx.customer.update({
        where: { id: customerId },
        data: {
          ledgerBalance: customer.ledgerBalance + grandTotal,
          updatedAt: new Date()
        }
      });

      return updatedInvoice;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating invoice from shipments:', error);
    return res.status(400).json({ error: error.message || 'Failed to create invoice' });
  }
}

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}-`
      }
    }
  });
  
  const nextNumber = (count + 1).toString().padStart(6, '0');
  return `INV-${year}-${nextNumber}`;
}


