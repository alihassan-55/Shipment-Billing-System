// Integration controller for cross-phase operations
// This handles complex operations that span multiple entities

import { prisma } from '../db/client.js';
import { REFERENCE_FORMATS, PAYMENT_STATUS, LEDGER_ENTRY_TYPES } from '../types/integration.js';

// ===== PAYMENT OPERATIONS =====
export async function createPayment(req, res) {
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

  try {
    const payment = await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        customerId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDate: new Date(paymentDate),
        invoiceId: invoiceId || null,
        shipmentId: shipmentId || null,
        notes: notes || '',
        receiptNumber: receiptNumber || `PAY-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        customer: true,
        invoice: true
      }
    });

    res.json({
      success: true,
      data: payment,
      message: 'Payment created successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment: ' + error.message
    });
  }
}

export async function getPayments(req, res) {
  const { customerId, status, paymentMethod, startDate, endDate, page = 1, limit = 20 } = req.query;

  try {
    const where = {};
    if (customerId) where.customerId = customerId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true }
          },
          invoice: {
            select: { id: true, invoiceNumber: true, total: true }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments: ' + error.message
    });
  }
}

export async function recordPaymentWithLedger(req, res) {
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          amount: parseFloat(amount),
          paymentMethod,
          paymentDate: new Date(paymentDate),
          invoiceId: invoiceId || null,
          shipmentId: shipmentId || null,
          notes: notes || '',
          receiptNumber: receiptNumber || `PAY-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create ledger entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          referenceId: payment.id,
          entryType: LEDGER_ENTRY_TYPES.PAYMENT,
          description: REFERENCE_FORMATS.PAYMENT(payment.receiptNumber),
          debit: 0,
          credit: parseFloat(amount),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update customer balance
      await tx.customer.update({
        where: { id: customerId },
        data: {
          ledgerBalance: {
            decrement: parseFloat(amount)
          }
        }
      });

      // Update invoice if linked
      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          select: { total: true, paidAmount: true }
        });

        if (invoice) {
          const newPaidAmount = (invoice.paidAmount || 0) + parseFloat(amount);
          const isFullyPaid = newPaidAmount >= invoice.total;

          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaidAmount,
              status: isFullyPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL
            }
          });
        }
      }

      return { payment, ledgerEntry };
    });

    res.json({
      success: true,
      data: result,
      message: 'Payment and ledger entry created successfully'
    });
  } catch (error) {
    console.error('Error recording payment with ledger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment: ' + error.message
    });
  }
}

// ===== LEDGER OPERATIONS =====
export async function createLedgerEntry(req, res) {
  const {
    customerId,
    referenceId,
    entryType,
    description,
    debit,
    credit,
    invoiceId,
    paymentId,
    shipmentId
  } = req.body;

  try {
    const ledgerEntry = await prisma.ledgerEntry.create({
      data: {
        id: crypto.randomUUID(),
        customerId,
        referenceId: referenceId || null,
        entryType,
        description,
        debit: parseFloat(debit || 0),
        credit: parseFloat(credit || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: { id: true, name: true }
        }
      }
    });

    // Update customer balance
    const netAmount = parseFloat(credit || 0) - parseFloat(debit || 0);
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        ledgerBalance: {
          increment: netAmount
        }
      }
    });

    res.json({
      success: true,
      data: ledgerEntry,
      message: 'Ledger entry created successfully'
    });
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ledger entry: ' + error.message
    });
  }
}

export async function getLedgerEntries(req, res) {
  const { customerId, entryType, startDate, endDate, page = 1, limit = 20 } = req.query;

  try {
    const where = {};
    if (customerId) where.customerId = customerId;
    if (entryType) where.entryType = entryType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true }
          }
        }
      }),
      prisma.ledgerEntry.count({ where })
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ledger entries: ' + error.message
    });
  }
}

export async function getCustomerLedgerEntries(req, res) {
  const { id } = req.params;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;

  try {
    const where = { customerId: id };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ledgerEntry.count({ where })
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customer ledger entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer ledger entries: ' + error.message
    });
  }
}

// ===== CUSTOMER OPERATIONS =====
export async function getCustomers(req, res) {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        ledgerBalance: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers: ' + error.message
    });
  }
}

export async function getCustomer(req, res) {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          select: { id: true, invoiceNumber: true, total: true, status: true, createdAt: true }
        },
        payments: {
          select: { id: true, amount: true, paymentMethod: true, paymentDate: true }
        },
        ledgerEntries: {
          select: { id: true, entryType: true, description: true, debit: true, credit: true, createdAt: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer: ' + error.message
    });
  }
}

export async function getCustomerFinancialSummary(req, res) {
  const { id } = req.params;

  try {
    const [
      customer,
      totalInvoices,
      totalPayments,
      totalDebits,
      totalCredits,
      recentTransactions
    ] = await Promise.all([
      prisma.customer.findUnique({
        where: { id },
        select: { id: true, name: true, ledgerBalance: true }
      }),
      prisma.invoice.aggregate({
        where: { customerId: id },
        _sum: { total: true },
        _count: true
      }),
      prisma.payment.aggregate({
        where: { customerId: id },
        _sum: { amount: true },
        _count: true
      }),
      prisma.ledgerEntry.aggregate({
        where: { customerId: id },
        _sum: { debit: true }
      }),
      prisma.ledgerEntry.aggregate({
        where: { customerId: id },
        _sum: { credit: true }
      }),
      prisma.ledgerEntry.findMany({
        where: { customerId: id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          entryType: true,
          description: true,
          debit: true,
          credit: true,
          createdAt: true
        }
      })
    ]);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        customer,
        summary: {
          totalInvoices: totalInvoices._sum.total || 0,
          invoiceCount: totalInvoices._count || 0,
          totalPayments: totalPayments._sum.amount || 0,
          paymentCount: totalPayments._count || 0,
          totalDebits: totalDebits._sum.debit || 0,
          totalCredits: totalCredits._sum.credit || 0,
          currentBalance: customer.ledgerBalance
        },
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching customer financial summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer financial summary: ' + error.message
    });
  }
}

// ===== INVOICE OPERATIONS =====
export async function getInvoices(req, res) {
  const { customerId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

  try {
    const where = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true }
          },
          lineItems: true
        }
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices: ' + error.message
    });
  }
}

export async function updateInvoiceStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { customer: true }
    });

    // If status is "Add to Ledger", create ledger entry
    if (status === PAYMENT_STATUS.ADD_TO_LEDGER) {
      await prisma.ledgerEntry.create({
        data: {
          id: crypto.randomUUID(),
          customerId: invoice.customerId,
          referenceId: invoice.id,
          entryType: LEDGER_ENTRY_TYPES.INVOICE,
          description: REFERENCE_FORMATS.INVOICE(invoice.invoiceNumber),
          debit: invoice.total,
          credit: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update customer balance
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          ledgerBalance: {
            increment: invoice.total
          }
        }
      });
    }

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice status updated successfully'
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice status: ' + error.message
    });
  }
}

// ===== SHIPMENT OPERATIONS =====
export async function getShipments(req, res) {
  const { customerId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

  try {
    const where = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.bookedAt = {};
      if (startDate) where.bookedAt.gte = new Date(startDate);
      if (endDate) where.bookedAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [shipments, total] = await Promise.all([
      prisma.shipments.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { bookedAt: 'desc' },
        include: {
          Customer: {
            select: { id: true, name: true, phone: true }
          },
          service_providers: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.shipments.count({ where })
    ]);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipments: ' + error.message
    });
  }
}

export async function getShipmentInvoices(req, res) {
  const { id } = req.params;

  try {
    const invoices = await prisma.shipment_invoices.findMany({
      where: { shipmentId: id },
      include: {
        lineItems: true
      }
    });

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching shipment invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipment invoices: ' + error.message
    });
  }
}

// ===== EXPORT OPERATIONS =====
export async function exportFinancialData(req, res) {
  const { entityType } = req.params;
  const { format = 'csv', ...filters } = req.query;

  try {
    // This would implement actual export functionality
    // For now, return a placeholder response
    res.json({
      success: true,
      message: `Export functionality for ${entityType} in ${format} format will be implemented`,
      data: { entityType, format, filters }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data: ' + error.message
    });
  }
}

// ===== MISSING FUNCTIONS FOR ROUTES =====

export async function getPayment(req, res) {
  const { id } = req.params;
  
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment: ' + error.message
    });
  }
}

export async function updatePayment(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        invoice: true
      }
    });

    res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment: ' + error.message
    });
  }
}

export async function deletePayment(req, res) {
  const { id } = req.params;

  try {
    await prisma.payment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment: ' + error.message
    });
  }
}

export async function updateLedgerEntry(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const ledgerEntry = await prisma.ledgerEntry.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      data: ledgerEntry,
      message: 'Ledger entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ledger entry: ' + error.message
    });
  }
}

export async function deleteLedgerEntry(req, res) {
  const { id } = req.params;

  try {
    await prisma.ledgerEntry.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Ledger entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ledger entry: ' + error.message
    });
  }
}

export async function getCustomerLedgerBalance(req, res) {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ledgerBalance: true
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        customerName: customer.name,
        ledgerBalance: customer.ledgerBalance
      }
    });
  } catch (error) {
    console.error('Error fetching customer ledger balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer ledger balance: ' + error.message
    });
  }
}

export async function getCustomerInvoices(req, res) {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { customerId: id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          lineItems: true
        }
      }),
      prisma.invoice.count({ where: { customerId: id } })
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer invoices: ' + error.message
    });
  }
}

export async function getCustomerShipments(req, res) {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const skip = (page - 1) * limit;

    const [shipments, total] = await Promise.all([
      prisma.shipments.findMany({
        where: { customerId: id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          service_providers: true,
          consignees: true,
          billing_invoices: true
        }
      }),
      prisma.shipments.count({ where: { customerId: id } })
    ]);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customer shipments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer shipments: ' + error.message
    });
  }
}

export async function getInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice: ' + error.message
    });
  }
}

export async function generateInvoicePDF(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Import PDF generator
    const { generateInvoicePDF } = await import('../utils/pdfGenerator.js');
    const pdfPath = await generateInvoicePDF(invoice);

    res.download(pdfPath, `invoice-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice PDF: ' + error.message
    });
  }
}

export async function getShipment(req, res) {
  const { id } = req.params;

  try {
    const shipment = await prisma.shipments.findUnique({
      where: { id },
      include: {
        service_providers: true,
        Customer: true,
        consignees: true,
        shipment_boxes: true,
        product_invoice_items: true,
        billing_invoices: true
      }
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    res.json({
      success: true,
      data: shipment
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipment: ' + error.message
    });
  }
}

export async function createCrossReference(req, res) {
  const { entityType, entityId, referenceType, referenceId } = req.body;

  try {
    // This would create cross-references between entities
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Cross-reference functionality not yet implemented',
      data: {
        entityType,
        entityId,
        referenceType,
        referenceId
      }
    });
  } catch (error) {
    console.error('Error creating cross-reference:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cross-reference: ' + error.message
    });
  }
}

export async function getCrossReferences(req, res) {
  const { entityType, entityId } = req.params;

  try {
    // This would fetch cross-references for an entity
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Cross-reference functionality not yet implemented',
      data: []
    });
  } catch (error) {
    console.error('Error fetching cross-references:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cross-references: ' + error.message
    });
  }
}

export async function updateInvoiceWithPayment(req, res) {
  const { id } = req.params;
  const { paymentAmount } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { total: true, paidAmount: true }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const newPaidAmount = (invoice.paidAmount || 0) + parseFloat(paymentAmount);
    const isFullyPaid = newPaidAmount >= invoice.total;

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'PAID' : 'PARTIAL'
      }
    });

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice updated with payment'
    });
  } catch (error) {
    console.error('Error updating invoice with payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice with payment: ' + error.message
    });
  }
}

export async function bulkUpdateInvoiceStatus(req, res) {
  const { invoiceIds, status } = req.body;

  try {
    const result = await prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      data: {
        status
      }
    });

    res.json({
      success: true,
      data: {
        updatedCount: result.count
      },
      message: `${result.count} invoices updated successfully`
    });
  } catch (error) {
    console.error('Error bulk updating invoice status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update invoice status: ' + error.message
    });
  }
}
