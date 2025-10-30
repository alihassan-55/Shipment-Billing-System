// File: paymentController.js
// Purpose: Enhanced payment management with automatic invoice updates and ledger tracking
// Dependencies: prisma client, integrationService

import { prisma } from '../db/client.js';
import crypto from 'crypto';
import { IntegrationService } from '../services/integrationService.js';

export async function recordPayment(req, res) {
  const { 
    customerId,
    amount, 
    paymentMethod, 
    paymentDate,
    invoiceId, 
    shipmentId,
    notes, 
    receiptNumber 
  } = req.body;

  if (!customerId || !amount || !paymentMethod || !paymentDate) {
    return res.status(400).json({ 
      error: 'Customer ID, amount, payment method, and payment date are required' 
    });
  }

  try {
    // Use Integration Service for cohesive payment recording
    const paymentData = {
      customerId,
      amount,
      paymentMethod,
      paymentDate,
      invoiceId,
      shipmentId,
      notes,
      receiptNumber
    };

    const result = await IntegrationService.recordPaymentWithIntegration(paymentData, req.user.sub);

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


