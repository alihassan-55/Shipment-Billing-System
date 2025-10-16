import { prisma } from '../db/client.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

// Invoice number generation service
class InvoiceNumberService {
  static async getNextInvoiceNumber(type) {
    const prefix = type === 'DECLARED_VALUE' ? 'DV' : 'BL';
    const year = new Date().getFullYear();
    
    // Count existing invoices of this type for this year
    const count = await prisma.shipment_invoices.count({
      where: {
        invoiceNumber: {
          startsWith: `${prefix}-${year}-`
        }
      }
    });
    
    const nextNumber = (count + 1).toString().padStart(6, '0');
    return `${prefix}-${year}-${nextNumber}`;
  }
}

// Main shipment invoice service
export class ShipmentInvoiceService {
  /**
   * Create both Declared Value and Billing invoices for a shipment
   * @param {string} shipmentId - The shipment ID
   * @returns {Promise<{declaredValueInvoice: Object, billingInvoice: Object}>}
   */
  static async createForShipment(shipmentId) {
    return await prisma.$transaction(async (tx) => {
      // Load shipment with all related data
      const shipment = await tx.shipments.findUnique({
        where: { id: shipmentId },
        include: {
          shippers: true,
          consignees: true,
          service_providers: true,
          product_invoice_items: true,
          billing_invoices: true,
          shipment_boxes: true
        }
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status !== 'Confirmed') {
        throw new Error('Can only create invoices for confirmed shipments');
      }

      // Check if invoices already exist
      const existingInvoices = await tx.shipment_invoices.findMany({
        where: { shipmentId }
      });

      if (existingInvoices.length > 0) {
        // Return existing invoices
        return {
          declaredValueInvoice: existingInvoices.find(inv => inv.type === 'DECLARED_VALUE'),
          billingInvoice: existingInvoices.find(inv => inv.type === 'BILLING')
        };
      }

      // Create Declared Value Invoice
      const declaredValueInvoice = await this.createDeclaredValueInvoice(shipment, tx);
      
      // Create Billing Invoice
      const billingInvoice = await this.createBillingInvoice(shipment, tx);

      return {
        declaredValueInvoice,
        billingInvoice
      };
    });
  }

  /**
   * Create Declared Value Invoice
   */
  static async createDeclaredValueInvoice(shipment, tx) {
    const invoiceNumber = await InvoiceNumberService.getNextInvoiceNumber('DECLARED_VALUE');
    
    // Calculate declared value from product items
    const declaredValue = (shipment.product_invoice_items || []).reduce(
      (sum, item) => sum + (item.pieces * item.unitValue), 0
    );

    // Create invoice
    const invoice = await tx.shipment_invoices.create({
      data: {
        invoiceNumber,
        type: 'DECLARED_VALUE',
        shipmentId: shipment.id,
        customerAccountId: shipment.billing_invoices?.customerAccountId,
        subtotal: declaredValue,
        tax: 0,
        total: declaredValue,
        currency: 'PKR',
        status: 'Confirmed',
        lineItems: {
          create: (shipment.product_invoice_items || []).map(item => ({
            description: item.description,
            quantity: item.pieces,
            unitPrice: item.unitValue,
            total: item.pieces * item.unitValue
          }))
        }
      },
      include: {
        lineItems: true
      }
    });

    // Generate PDF synchronously
    const pdfPath = await this.generateInvoicePDF(invoice.id, 'DECLARED_VALUE', invoice);

    return invoice;
  }

  /**
   * Create Billing Invoice
   */
  static async createBillingInvoice(shipment, tx) {
    const invoiceNumber = await InvoiceNumberService.getNextInvoiceNumber('BILLING');
    
    if (!shipment.billing_invoices) {
      throw new Error('Billing invoice data not found for shipment');
    }

    const billing = shipment.billing_invoices;
    
    // Create line items for billing invoice
    const lineItems = [];
    
    // Base freight line
    if (billing.ratePerKg && billing.totalRate) {
      lineItems.push({
        description: `Freight (${shipment.chargedWeightKg}kg @ PKR ${billing.ratePerKg}/kg)`,
        quantity: shipment.chargedWeightKg,
        unitPrice: billing.ratePerKg,
        total: billing.totalRate
      });
    } else if (billing.totalRate) {
      lineItems.push({
        description: 'Freight',
        quantity: 1,
        unitPrice: billing.totalRate,
        total: billing.totalRate
      });
    }

    // Other charges
    if (billing.eFormCharges > 0) {
      lineItems.push({
        description: 'FORM E / I CHARGES',
        quantity: 1,
        unitPrice: billing.eFormCharges,
        total: billing.eFormCharges
      });
    }

    if (billing.remoteAreaCharges > 0) {
      lineItems.push({
        description: 'Remote area charges',
        quantity: 1,
        unitPrice: billing.remoteAreaCharges,
        total: billing.remoteAreaCharges
      });
    }

    if (billing.boxCharges > 0) {
      lineItems.push({
        description: 'Box charges',
        quantity: 1,
        unitPrice: billing.boxCharges,
        total: billing.boxCharges
      });
    }

    // Adjustment line (if any)
    const calculatedTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const adjustment = billing.grandTotal - calculatedTotal;
    
    if (Math.abs(adjustment) > 0.01) {
      lineItems.push({
        description: 'Adjustment',
        quantity: 1,
        unitPrice: adjustment,
        total: adjustment
      });
    }

    // Create invoice
    const invoice = await tx.shipment_invoices.create({
      data: {
        invoiceNumber,
        type: 'BILLING',
        shipmentId: shipment.id,
        customerAccountId: billing.customerAccountId,
        subtotal: billing.grandTotal,
        tax: 0,
        total: billing.grandTotal,
        currency: 'PKR',
        status: billing.paymentMethod === 'Cash' ? 'Paid' : 'Confirmed',
        lineItems: {
          create: lineItems
        }
      },
      include: {
        lineItems: true
      }
    });

    // Create ledger entry if Credit payment
    if (billing.paymentMethod === 'Credit' && billing.customerAccountId) {
      const ledgerEntry = await tx.ledger_entries.create({
        data: {
          shipmentId: shipment.id,
          customerAccountId: billing.customerAccountId,
          amount: billing.grandTotal,
          currency: 'PKR',
          status: 'Pending'
        }
      });

      // Update invoice with ledger entry ID
      await tx.shipment_invoices.update({
        where: { id: invoice.id },
        data: { 
          postedLedgerEntryId: ledgerEntry.id,
          status: 'Posted'
        }
      });
    }

    // Generate PDF synchronously
    const pdfPath = await this.generateInvoicePDF(invoice.id, 'BILLING', invoice);

    return invoice;
  }

  /**
   * Generate PDF for invoice
   */
  static async generateInvoicePDF(invoiceId, type, invoiceData = null) {
    try {
      let invoice = invoiceData;
      
      // If invoice data is not provided, fetch it from database
      if (!invoice) {
        invoice = await prisma.shipment_invoices.findUnique({
          where: { id: invoiceId },
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
      }

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate PDF using existing PDF generator
      const pdfPath = await generateInvoicePDF(invoiceId, type, invoice);
      
      // Update invoice with PDF URL
      await prisma.shipment_invoices.update({
        where: { id: invoiceId },
        data: { pdfUrl: pdfPath }
      });

      return pdfPath;
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a shipment
   */
  static async getShipmentInvoices(shipmentId) {
    return await prisma.shipment_invoices.findMany({
      where: { shipmentId },
      include: {
        lineItems: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Regenerate PDF for an invoice
   */
  static async regeneratePDF(invoiceId) {
    const invoice = await prisma.shipment_invoices.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return await this.generateInvoicePDF(invoiceId, invoice.type);
  }
}
