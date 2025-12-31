// File: ledgerController.js
// Purpose: Manage all ledger entries, linked to invoices and payments
// Dependencies: invoices.controller.js, payments.controller.js, shipments.controller.js

import { prisma } from '../db/client.js';
import crypto from 'crypto';

/**
 * Get ledger entries for a customer
 */
export async function getCustomerLedger(req, res) {
  const { customerId } = req.params;
  const { page = 1, limit = 20, from, to } = req.query;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Build where clause
    const where = { customerId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get ledger entries
    const [entries, total, totals] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [req.query.sortBy || 'createdAt']: req.query.sortOrder || 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              personName: true
            }
          }
        }
      }),
      prisma.ledgerEntry.count({ where }),
      prisma.ledgerEntry.aggregate({
        where,
        _sum: {
          debit: true,
          credit: true
        }
      })
    ]);

    const totalDebit = totals._sum.debit || 0;
    const totalCredit = totals._sum.credit || 0;
    const balanceDue = totalDebit - totalCredit;

    return res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        personName: customer.personName,
        ledgerBalance: customer.ledgerBalance
      },
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: {
        totalDebit,
        totalCredit,
        balanceDue
      }
    });
  } catch (error) {
    console.error('Error fetching customer ledger:', error);
    return res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
}

/**
 * Get all ledger entries (admin function)
 */
export async function getAllLedgerEntries(req, res) {
  const { page = 1, limit = 20, customerId, entryType, from, to } = req.query;

  try {
    const where = {};
    if (customerId) where.customerId = customerId;
    if (entryType) where.entryType = entryType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total, totals] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [req.query.sortBy || 'createdAt']: req.query.sortOrder || 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              personName: true
            }
          }
        }
      }),
      prisma.ledgerEntry.count({ where }),
      prisma.ledgerEntry.aggregate({
        where,
        _sum: {
          debit: true,
          credit: true
        }
      })
    ]);

    const totalDebit = totals._sum.debit || 0;
    const totalCredit = totals._sum.credit || 0;
    const balanceDue = totalDebit - totalCredit;

    return res.json({
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: {
        totalDebit,
        totalCredit,
        balanceDue
      }
    });
  } catch (error) {
    console.error('Error fetching all ledger entries:', error);
    return res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
}

/**
 * Create manual ledger entry (for adjustments)
 */
export async function createLedgerEntry(req, res) {
  const { customerId, entryType, description, debit, credit, notes } = req.body;

  if (!customerId || !entryType || !description) {
    return res.status(400).json({
      error: 'Customer ID, entry type, and description are required'
    });
  }

  if ((debit || 0) === 0 && (credit || 0) === 0) {
    return res.status(400).json({
      error: 'Either debit or credit amount must be provided'
    });
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

      const debitAmount = parseFloat(debit || 0);
      const creditAmount = parseFloat(credit || 0);
      const netAmount = debitAmount - creditAmount;
      const newBalance = customer.ledgerBalance + netAmount;

      // Create ledger entry
      const entry = await tx.ledgerEntry.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          entryType,
          description,
          debit: debitAmount,
          credit: creditAmount,
          balanceAfter: newBalance,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              personName: true
            }
          }
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

      return entry;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    return res.status(400).json({ error: error.message || 'Failed to create ledger entry' });
  }
}

/**
 * Get ledger summary for dashboard
 */
export async function getLedgerSummary(req, res) {
  try {
    const [
      totalCustomers,
      totalDebit,
      totalCredit,
      recentEntries
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.ledgerEntry.aggregate({
        _sum: { debit: true }
      }),
      prisma.ledgerEntry.aggregate({
        _sum: { credit: true }
      }),
      prisma.ledgerEntry.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              personName: true
            }
          }
        }
      })
    ]);

    const netBalance = (totalDebit._sum.debit || 0) - (totalCredit._sum.credit || 0);

    return res.json({
      summary: {
        totalCustomers,
        totalDebit: totalDebit._sum.debit || 0,
        totalCredit: totalCredit._sum.credit || 0,
        netBalance
      },
      recentEntries
    });
  } catch (error) {
    console.error('Error fetching ledger summary:', error);
    return res.status(500).json({ error: 'Failed to fetch ledger summary' });
  }
}
