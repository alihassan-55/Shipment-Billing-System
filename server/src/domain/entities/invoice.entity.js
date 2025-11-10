import { z } from 'zod';

export const InvoiceStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
};

export const InvoiceSchema = z.object({
  id: z.number().optional(),
  invoiceNumber: z.string(),
  customerId: z.number(),
  shipmentIds: z.array(z.number()),
  subtotal: z.number().positive(),
  tax: z.number().min(0),
  total: z.number().positive(),
  status: z.enum([
    InvoiceStatus.DRAFT,
    InvoiceStatus.SENT,
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.OVERDUE
  ]).default(InvoiceStatus.DRAFT),
  dueDate: z.date(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export class Invoice {
  constructor(data) {
    Object.assign(this, InvoiceSchema.parse(data));
  }

  isOverdue() {
    return this.dueDate < new Date() && this.status !== InvoiceStatus.PAID;
  }

  canBePaid() {
    return this.status === InvoiceStatus.SENT || this.status === InvoiceStatus.OVERDUE;
  }

  calculateBalance(payments = []) {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return this.total - totalPaid;
  }

  toJSON() {
    return {
      ...this,
      isOverdue: this.isOverdue()
    };
  }
}