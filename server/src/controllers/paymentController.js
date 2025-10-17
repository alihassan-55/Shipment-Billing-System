// File: paymentController.js
// Purpose: Enhanced payment management with automatic invoice updates and ledger tracking
// Dependencies: prisma client, ledgerService

import { prisma } from '../db/client.js';
import crypto from 'crypto';

export async function recordPayment(req, res) {
  const { invoiceId, amount, paymentType, notes, reference, receivedBy } = req.body;

  if (!invoiceId || !amount || !paymentType) {
    return res.status(400).json({ error: 'Invoice ID, amount, and payment type are required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get invoice with customer
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { 
          payments: true,
          customer: true
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          invoiceId,
          customerId: invoice.customerId,
          amount: parseFloat(amount),
          paymentType,
          notes,
          reference,
          receivedBy: receivedBy || req.user?.sub || req.user?.id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      });

      // Calculate new payment total
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + parseFloat(amount);
      const outstanding = invoice.total - totalPaid;

      // Update invoice status
      let newStatus = 'UNPAID';
      if (outstanding <= 0) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      // Update invoice with new totals
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { 
          amountPaid: totalPaid,
          balanceDue: outstanding,
          status: newStatus,
          updatedAt: new Date()
        },
        include: {
          customer: true,
          payments: true,
          lineItems: true
        }
      });

      // Create ledger entry for payment
      await tx.ledgerEntry.create({
        data: {
          id: crypto.randomUUID(),
          customerId: invoice.customerId,
          referenceId: payment.id,
          entryType: 'PAYMENT',
          description: `Payment received for invoice ${invoice.invoiceNumber}`,
          debit: 0,
          credit: parseFloat(amount),
          balanceAfter: invoice.customer.ledgerBalance - parseFloat(amount),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update customer ledger balance
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          ledgerBalance: invoice.customer.ledgerBalance - parseFloat(amount),
          updatedAt: new Date()
        }
      });

      return {
        payment,
        invoice: updatedInvoice,
        totalPaid,
        outstanding,
        status: newStatus
      };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error recording payment:', error);
    return res.status(400).json({ error: error.message || 'Failed to record payment' });
  }
}

export async function getPayments(req, res) {
  const { invoiceId, customerId, from, to, page = 1, limit = 20 } = req.query;

  const where = {};
  if (invoiceId) where.invoiceId = invoiceId;
  if (customerId) where.customerId = customerId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
          customer: true
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
}


