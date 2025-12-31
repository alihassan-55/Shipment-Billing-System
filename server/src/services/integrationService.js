// server/src/services/integrationService.js
// Unified Integration Service for Shipment->Invoice->Ledger->Payment flow
// This service provides cohesive integration between all financial components

import { prisma } from '../db/client.js';
import crypto from 'crypto';
import {
  LEDGER_ENTRY_TYPES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  REFERENCE_FORMATS,
  BUSINESS_RULES,
  ERROR_MESSAGES
} from '../types/integration.js';

export class IntegrationService {

  /**
   * Complete Shipment Creation Flow
   * Creates shipment, billing invoice, and ledger entries in one transaction
   */
  static async createShipmentWithBilling(shipmentData, userId) {
    const {
      referenceNumber,
      serviceProviderId,
      customerId,
      consigneeId,
      terms,
      boxes,
      actualWeightKg,
      volumeWeightKg,
      chargedWeightKg,
      productInvoice,
      billingInvoice,
      status = 'Draft'
    } = shipmentData;

    return await prisma.$transaction(async (tx) => {
      // 1. Create the shipment
      const shipment = await tx.shipments.create({
        data: {
          id: crypto.randomUUID(),
          referenceNumber,
          serviceProviderId,
          customerId,
          consigneeId,
          terms,
          actualWeightKg: parseFloat(actualWeightKg),
          volumeWeightKg: parseFloat(volumeWeightKg || 0),
          chargedWeightKg: parseFloat(chargedWeightKg || actualWeightKg || 0),
          status,
          createdById: userId,
          updatedAt: new Date(),
          shipment_boxes: {
            create: (boxes || []).map(box => ({
              id: crypto.randomUUID(),
              index: parseInt(box.index),
              lengthCm: parseFloat(box.lengthCm),
              widthCm: parseFloat(box.widthCm),
              heightCm: parseFloat(box.heightCm),
              volumetricWeightKg: parseFloat(box.volumetricWeightKg || 0),
              actualWeightKg: box.actualWeightKg ? parseFloat(box.actualWeightKg) : null,
              createdAt: new Date()
            }))
          },
          product_invoice_items: productInvoice?.items ? {
            create: productInvoice.items.map(item => ({
              id: crypto.randomUUID(),
              boxIndex: parseInt(item.boxIndex),
              description: item.description,
              hsCode: item.hsCode,
              pieces: parseInt(item.pieces),
              unitValue: parseFloat(item.unitValue),
              total: parseInt(item.pieces) * parseFloat(item.unitValue),
              createdAt: new Date()
            }))
          } : undefined,
          billing_invoices: billingInvoice ? {
            create: {
              id: crypto.randomUUID(),
              ratePerKg: billingInvoice.ratePerKg ? parseFloat(billingInvoice.ratePerKg) : null,
              totalRate: billingInvoice.totalRate ? parseFloat(billingInvoice.totalRate) : null,
              eFormCharges: parseFloat(billingInvoice.eFormCharges || 0),
              remoteAreaCharges: parseFloat(billingInvoice.remoteAreaCharges || 0),
              boxCharges: parseFloat(billingInvoice.boxCharges || 0),
              grandTotal: parseFloat(billingInvoice.grandTotal || 0),
              paymentMethod: billingInvoice.paymentMethod,
              customerAccountId: billingInvoice.customerAccountId,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          } : undefined
        },
        include: {
          Customer: true,
          billing_invoices: true
        }
      });

      // 2. Do NOT create ledger entries at creation time; ledger will be updated
      //    when invoices are generated (on confirmation) or when payments are recorded

      return shipment;
    });
  }

  /**
   * Complete Shipment Confirmation Flow
   * Confirms shipment and creates all related invoices and ledger entries
   */
  static async confirmShipmentWithInvoices(shipmentId, userId) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update shipment status
      const shipment = await tx.shipments.update({
        where: { id: shipmentId },
        data: { status: 'Confirmed' },
        include: {
          Customer: true,
          billing_invoices: true,
          product_invoice_items: true
        }
      });

      // 2. Create shipment invoices (Declared Value + Billing)
      const { ShipmentInvoiceService } = await import('./shipmentInvoiceService.js');
      // PASS THE EXISTING TRANSACTION (tx) to avoid deadlock
      const invoices = await ShipmentInvoiceService.createForShipment(shipmentId, tx);

      // Main customer invoice is created inside ShipmentInvoiceService.createForShipment

      return { shipment, invoices };
    }, {
      maxWait: 5000, // default: 2000
      timeout: 20000 // default: 5000
    });

    // 3. Post-Transaction: Generate PDFs securely
    // Now that the transaction is committed (row lock released), we can safely generate PDFs/upload to S3
    const { ShipmentInvoiceService } = await import('./shipmentInvoiceService.js');
    try {
      console.log('Starting async PDF generation for shipment:', shipmentId);

      if (result.invoices && result.invoices.declaredValueInvoice) {
        const invId = result.invoices.declaredValueInvoice.id;
        console.log('Generating PDF for DV Invoice:', invId);
        const pdfPath = await ShipmentInvoiceService.regeneratePDF(invId);
        console.log('DV Invoice PDF generated at:', pdfPath);
        result.invoices.declaredValueInvoice.pdfUrl = pdfPath;
      }

      if (result.invoices && result.invoices.billingInvoice) {
        const invId = result.invoices.billingInvoice.id;
        console.log('Generating PDF for Billing Invoice:', invId);
        const pdfPath = await ShipmentInvoiceService.regeneratePDF(invId);
        console.log('Billing Invoice PDF generated at:', pdfPath);
        result.invoices.billingInvoice.pdfUrl = pdfPath;
      }

      console.log('Async PDF generation completed. URLs attached to response.');
    } catch (error) {
      console.error('Error in post-confirmation PDF generation:', error);
      // We log only; do not fail the request as the shipment is already confirmed and invoiced.
    }

    return result;
  }

  /**
   * Complete Payment Recording Flow
   * Records payment, updates invoice status, and creates ledger entries
   */
  static async recordPaymentWithIntegration(paymentData, userId) {
    const {
      customerId,
      amount,
      paymentMethod,
      paymentDate,
      invoiceId,
      shipmentId,
      notes,
      receiptNumber
    } = paymentData;

    return await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          amount: parseFloat(amount),
          paymentType: paymentMethod,
          notes: notes || '',
          reference: receiptNumber || `PAY-${Date.now()}`,
          createdAt: new Date(paymentDate), // Use provided date as creation date
          updatedAt: new Date(),
          customer: {
            connect: { id: customerId }
          },
          invoice: invoiceId ? {
            connect: { id: invoiceId }
          } : undefined
        }
      });

      // 2. Create ledger entry for payment
      await this.createLedgerEntry(tx, {
        customerId,
        referenceId: payment.id,
        entryType: LEDGER_ENTRY_TYPES.PAYMENT,
        description: REFERENCE_FORMATS.PAYMENT(payment.reference),
        debit: 0,
        credit: parseFloat(amount)
      });

      // 3. Update customer ledger balance
      await tx.customer.update({
        where: { id: customerId },
        data: {
          ledgerBalance: {
            decrement: parseFloat(amount)
          }
        }
      });

      // 4. Update invoice if linked
      let updatedInvoice = null;
      if (invoiceId) {
        updatedInvoice = await this.updateInvoiceWithPayment(invoiceId, parseFloat(amount), tx);
      }

      return { payment, updatedInvoice };
    });
  }

  /**
   * Complete Invoice Status Update Flow
   * Updates invoice status and creates appropriate ledger entries
   */
  static async updateInvoiceStatusWithLedger(invoiceId, newStatus, userId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get invoice with customer
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { customer: true }
      });

      if (!invoice) {
        throw new Error(ERROR_MESSAGES.INVOICE_NOT_FOUND);
      }

      // 2. Update invoice status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus }
      });

      // 3. Create ledger entry if status is ADD_TO_LEDGER
      if (newStatus === INVOICE_STATUSES.ADD_TO_LEDGER) {
        await this.createLedgerEntry(tx, {
          customerId: invoice.customerId,
          referenceId: invoice.id,
          entryType: LEDGER_ENTRY_TYPES.INVOICE,
          description: REFERENCE_FORMATS.INVOICE(invoice.invoiceNumber),
          debit: invoice.total,
          credit: 0
        });

        // Update customer balance
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            ledgerBalance: {
              increment: invoice.total
            }
          }
        });
      }

      return updatedInvoice;
    });
  }

  /**
   * Get Complete Financial Overview for Customer
   * Returns shipments, invoices, payments, and ledger entries
   */
  static async getCustomerFinancialOverview(customerId, filters = {}) {
    const { startDate, endDate, page = 1, limit = 20 } = filters;

    const whereClause = { customerId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [
      customer,
      shipments,
      invoices,
      payments,
      ledgerEntries,
      totals
    ] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          name: true,
          personName: true,
          ledgerBalance: true,
          phone: true,
          email: true
        }
      }),
      prisma.shipments.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          billing_invoices: true,
          service_providers: { select: { name: true } }
        }
      }),
      prisma.invoice.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lineItems: true
        }
      }),
      prisma.payment.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: { select: { invoiceNumber: true } }
        }
      }),
      prisma.ledgerEntry.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ledgerEntry.aggregate({
        where: whereClause,
        _sum: {
          debit: true,
          credit: true
        }
      })
    ]);

    return {
      customer,
      shipments,
      invoices,
      payments,
      ledgerEntries,
      totals: {
        totalDebit: totals._sum.debit || 0,
        totalCredit: totals._sum.credit || 0,
        netBalance: (totals._sum.debit || 0) - (totals._sum.credit || 0)
      },
      pagination: {
        page,
        limit,
        total: await prisma.ledgerEntry.count({ where: whereClause })
      }
    };
  }

  /**
   * Helper method to create ledger entry with balance calculation
   */
  static async createLedgerEntry(tx, entryData) {
    const { customerId, referenceId, entryType, description, debit, credit } = entryData;

    // Get current customer balance
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { ledgerBalance: true }
    });

    const debitAmount = Number(debit) || 0;
    const creditAmount = Number(credit) || 0;
    const newBalance = customer.ledgerBalance + debitAmount - creditAmount;

    const ledgerEntry = await tx.ledgerEntry.create({
      data: {
        id: crypto.randomUUID(),
        customerId,
        referenceId,
        entryType,
        description,
        debit: debit || 0,
        credit: credit || 0,
        balanceAfter: newBalance,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update customer balance
    await tx.customer.update({
      where: { id: customerId },
      data: {
        ledgerBalance: newBalance,
        updatedAt: new Date()
      }
    });

    return ledgerEntry;
  }

  /**
   * Helper method to create main invoice from shipment
   */
  static async createMainInvoiceFromShipment(shipment, billingInvoice, tx) {
    const invoiceNumber = await this.generateInvoiceNumber();

    const mainInvoice = await tx.invoice.create({
      data: {
        id: crypto.randomUUID(),
        invoiceNumber,
        customerId: shipment.customerId,
        total: billingInvoice.grandTotal,
        status: INVOICE_STATUSES.UNPAID,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create line item
    await tx.invoiceLineItem.create({
      data: {
        id: crypto.randomUUID(),
        invoiceId: mainInvoice.id,
        description: `Shipment ${shipment.referenceNumber} - ${billingInvoice.invoiceNumber}`,
        quantity: 1,
        unitPrice: billingInvoice.grandTotal,
        total: billingInvoice.grandTotal
      }
    });

    return mainInvoice;
  }

  /**
   * Helper method to update invoice with payment
   */
  static async updateInvoiceWithPayment(invoiceId, paymentAmount, tx) {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      select: { total: true, paidAmount: true }
    });

    if (!invoice) {
      throw new Error(ERROR_MESSAGES.INVOICE_NOT_FOUND);
    }

    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
    const isFullyPaid = newPaidAmount >= invoice.total;

    return await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIAL
      }
    });
  }

  /**
   * Helper method to generate unique invoice number
   */
  static async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`
        }
      }
    });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Validate business rules for operations
   */
  static validateBusinessRules(operation, data) {
    switch (operation) {
      case 'payment':
        if (data.amount < BUSINESS_RULES.MIN_PAYMENT_AMOUNT) {
          throw new Error(ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);
        }
        break;
      case 'invoice_status':
        const allowedTransitions = BUSINESS_RULES.ALLOWED_STATUS_TRANSITIONS[data.currentStatus] || [];
        if (!allowedTransitions.includes(data.newStatus)) {
          throw new Error(ERROR_MESSAGES.INVALID_INVOICE_STATUS);
        }
        break;
      default:
        break;
    }
  }
}
