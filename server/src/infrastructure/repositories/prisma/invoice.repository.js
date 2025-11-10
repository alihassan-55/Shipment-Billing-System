import { Invoice } from '../../domain/entities/invoice.entity';
import { InvoiceRepositoryInterface } from '../../domain/repositories/invoice.repository.interface';
import { prisma } from '../db/prisma';
import { Money } from '../../domain/value-objects/money';

export class PrismaInvoiceRepository extends InvoiceRepositoryInterface {
  async create(invoice) {
    const data = this._toDatabase(invoice);
    const created = await prisma.invoice.create({
      data,
      include: {
        shipments: true,
        payments: true
      }
    });
    return this._toDomain(created);
  }

  async findById(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        shipments: true,
        payments: true
      }
    });
    return invoice ? this._toDomain(invoice) : null;
  }

  async findByNumber(number) {
    const invoice = await prisma.invoice.findUnique({
      where: { number },
      include: {
        shipments: true,
        payments: true
      }
    });
    return invoice ? this._toDomain(invoice) : null;
  }

  async findByCustomer(customerId, filters = {}) {
    const { status, fromDate, toDate } = filters;
    
    const where = {
      customerId,
      ...(status && { status }),
      ...(fromDate && toDate && {
        issueDate: {
          gte: fromDate,
          lte: toDate
        }
      })
    };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        shipments: true,
        payments: true
      },
      orderBy: { issueDate: 'desc' }
    });

    return invoices.map(invoice => this._toDomain(invoice));
  }

  async update(invoice) {
    const data = this._toDatabase(invoice);
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data,
      include: {
        shipments: true,
        payments: true
      }
    });
    return this._toDomain(updated);
  }

  async delete(id) {
    await prisma.invoice.delete({
      where: { id }
    });
    return true;
  }

  async findOverdue() {
    const today = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          notIn: ['PAID', 'VOID']
        },
        dueDate: {
          lt: today
        }
      },
      include: {
        shipments: true,
        payments: true
      }
    });
    return invoices.map(invoice => this._toDomain(invoice));
  }

  async generateInvoiceNumber() {
    // Format: INV-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        number: {
          startsWith: `INV-${dateStr}`
        }
      },
      orderBy: {
        number: 'desc'
      }
    });

    let sequence = 1;
    if (lastInvoice) {
      sequence = parseInt(lastInvoice.number.split('-')[2]) + 1;
    }

    return `INV-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  _toDomain(data) {
    return new Invoice({
      customerId: data.customerId,
      number: data.number,
      shipments: data.shipments,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: data.status,
      payments: data.payments.map(p => ({
        ...p,
        amount: Money.from(p.amount)
      }))
    }, data.id);
  }

  _toDatabase(invoice) {
    return {
      id: invoice.id,
      customerId: invoice.customerId,
      number: invoice.number,
      shipments: {
        connect: invoice.shipments.map(s => ({ id: s.id }))
      },
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      subtotal: invoice.subtotal.amount,
      tax: invoice.tax.amount,
      total: invoice.total.amount,
      balance: invoice.balance.amount,
      payments: {
        create: invoice.payments.map(p => ({
          amount: p.amount.amount,
          method: p.method,
          reference: p.reference,
          date: p.date
        }))
      }
    };
  }
}