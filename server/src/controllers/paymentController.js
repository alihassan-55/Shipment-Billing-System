import { prisma } from '../db/client.js';

export async function recordPayment(req, res) {
  const { invoiceId, paymentDate, amount, method, reference } = req.body;

  if (!invoiceId || !amount || !method) {
    return res.status(400).json({ error: 'Invoice ID, amount, and method required' });
  }

  try {
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get invoice with payments
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amount: parseFloat(amount),
          method,
          reference,
          receivedBy: req.user.sub,
        },
      });

      // Calculate new payment total
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
      const outstanding = invoice.total - totalPaid;

      // Update invoice status
      let newStatus = 'Unpaid';
      if (outstanding <= 0) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partial';
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      return {
        payment,
        invoiceStatus: newStatus,
        totalPaid,
        outstanding,
      };
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Failed to record payment' });
  }
}

export async function getPayments(req, res) {
  const { invoiceId, from, to, page = 1, limit = 20 } = req.query;

  const where = {};
  if (invoiceId) where.invoiceId = invoiceId;
  if (from || to) {
    where.paymentDate = {};
    if (from) where.paymentDate.gte = new Date(from);
    if (to) where.paymentDate.lte = new Date(to);
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
        },
        orderBy: { paymentDate: 'desc' },
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


