import { prisma } from '../db/client.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { IntegrationService } from './integrationService.js';
import crypto from 'crypto';

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
          Customer: true,
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

      console.log('Shipment status check:', { shipmentId, status: shipment.status, expected: 'Confirmed' });

      if (shipment.status !== 'Confirmed') {
        throw new Error(`Can only create invoices for confirmed shipments. Current status: ${shipment.status}`);
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

      // Create main Invoice entry for customer ledger
      await this.createMainInvoiceEntry(shipment, billingInvoice, tx);

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
        currency: 'Rs',
        status: 'UNPAID',
        lineItems: {
          create: (shipment.product_invoice_items || []).map(item => ({
            id: crypto.randomUUID(),
            description: item.description,
            quantity: item.pieces,
            unitPrice: item.unitValue,
            total: item.pieces * item.unitValue,
            createdAt: new Date()
          }))
        }
      },
      include: {
        lineItems: true
      }
    });

    // Generate PDF synchronously - pass shipment data
    const invoiceWithShipment = {
      ...invoice,
      shipments: shipment
    };
    const pdfPath = await this.generateInvoicePDF(invoice.id, 'DECLARED_VALUE', invoiceWithShipment, tx);

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
        id: crypto.randomUUID(),
        description: `Freight (${shipment.chargedWeightKg}kg @ Rs ${billing.ratePerKg}/kg)`,
        quantity: shipment.chargedWeightKg,
        unitPrice: billing.ratePerKg,
        total: billing.totalRate,
        createdAt: new Date()
      });
    } else if (billing.totalRate) {
      lineItems.push({
        id: crypto.randomUUID(),
        description: 'Freight',
        quantity: 1,
        unitPrice: billing.totalRate,
        total: billing.totalRate,
        createdAt: new Date()
      });
    }

    // Other charges
    if (billing.eFormCharges > 0) {
      lineItems.push({
        id: crypto.randomUUID(),
        description: 'FORM E / I CHARGES',
        quantity: 1,
        unitPrice: billing.eFormCharges,
        total: billing.eFormCharges,
        createdAt: new Date()
      });
    }

    if (billing.remoteAreaCharges > 0) {
      lineItems.push({
        id: crypto.randomUUID(),
        description: 'Remote area charges',
        quantity: 1,
        unitPrice: billing.remoteAreaCharges,
        total: billing.remoteAreaCharges,
        createdAt: new Date()
      });
    }

    if (billing.boxCharges > 0) {
      lineItems.push({
        id: crypto.randomUUID(),
        description: 'Box charges',
        quantity: 1,
        unitPrice: billing.boxCharges,
        total: billing.boxCharges,
        createdAt: new Date()
      });
    }

    // Adjustment line (if any)
    const calculatedTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const adjustment = billing.grandTotal - calculatedTotal;
    
    if (Math.abs(adjustment) > 0.01) {
      lineItems.push({
        id: crypto.randomUUID(),
        description: 'Adjustment',
        quantity: 1,
        unitPrice: adjustment,
        total: adjustment,
        createdAt: new Date()
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
        currency: 'Rs',
        status: 'UNPAID',
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
      const ledgerEntry = await IntegrationService.createLedgerEntry(tx, {
        customerId: shipment.customerId,
        referenceId: invoice.id,
        entryType: 'INVOICE',
        description: `Shipment ${shipment.referenceNumber} - Billing Invoice ${invoice.invoiceNumber}`,
        debit: billing.grandTotal,
        credit: 0
      });

      await tx.shipment_invoices.update({
        where: { id: invoice.id },
        data: { postedLedgerEntryId: ledgerEntry.id }
      });
    }

    // Generate PDF synchronously - pass shipment data
    const invoiceWithShipment = {
      ...invoice,
      shipments: shipment
    };
    const pdfPath = await this.generateInvoicePDF(invoice.id, 'BILLING', invoiceWithShipment, tx);

    return invoice;
  }

  /**
   * Generate PDF for invoice
   */
  static async generateInvoicePDF(invoiceId, type, invoiceData = null, tx = null) {
    try {
      let invoice = invoiceData;
      
      // If invoice data is not provided, fetch it from database
      if (!invoice) {
        const prismaClient = tx || prisma;
        invoice = await prismaClient.shipment_invoices.findUnique({
          where: { id: invoiceId },
          include: {
            shipments: {
              include: {
                Customer: true,
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
      
      // Update invoice with PDF URL using the same transaction context
      const prismaClient = tx || prisma;
      await prismaClient.shipment_invoices.update({
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

  /**
   * Create main Invoice entry for customer ledger system
   */
  static async createMainInvoiceEntry(shipment, billingInvoice, tx) {
    if (!shipment.Customer) {
      throw new Error('Customer not found for shipment');
    }

    // Generate main invoice number
    const invoiceNumber = await this.generateMainInvoiceNumber();
    
    // Create main invoice
    const mainInvoice = await tx.invoice.create({
      data: {
        id: crypto.randomUUID(),
        invoiceNumber,
        customerId: shipment.customerId,
        issuedDate: new Date(),
        subtotal: billingInvoice.total,
        tax: 0, // No tax for now
        total: billingInvoice.total,
        amountPaid: 0,
        balanceDue: billingInvoice.total,
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create line item for the shipment
    await tx.invoiceLineItem.create({
      data: {
        id: crypto.randomUUID(),
        invoiceId: mainInvoice.id,
        description: `Shipment ${shipment.referenceNumber} - ${billingInvoice.invoiceNumber}`,
        quantity: 1,
        unitPrice: billingInvoice.total,
        total: billingInvoice.total
      }
    });

    // Create ledger entry
    await tx.ledgerEntry.create({
      data: {
        id: crypto.randomUUID(),
        customerId: shipment.customerId,
        referenceId: mainInvoice.id,
        entryType: 'INVOICE',
        description: `Invoice ${invoiceNumber} created for shipment ${shipment.referenceNumber}`,
        debit: billingInvoice.total,
        credit: 0,
        balanceAfter: shipment.Customer.ledgerBalance + billingInvoice.total,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update customer ledger balance
    const updatedCustomer = await tx.customer.update({
         where: { id: shipment.customerId },
          data: {
          ledgerBalance: { increment: billingInvoice.total },
         updatedAt: new Date()
          }
        });
          await tx.ledgerEntry.update({
            where: { id: createdLedgerEntry.id },
            data: { balanceAfter: updatedCustomer.ledgerBalance }
          });

    return mainInvoice;
  }

  /**
   * Generate unique main invoice number
   */
  static async generateMainInvoiceNumber() {
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
}
