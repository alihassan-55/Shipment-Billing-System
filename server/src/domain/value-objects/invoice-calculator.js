import { Money } from './money.js';

export class InvoiceCalculator {
  static DEFAULT_TAX_RATE = 0.15; // 15% tax rate

  static calculateTotals(shipments, taxRate = InvoiceCalculator.DEFAULT_TAX_RATE) {
    const subtotal = shipments.reduce((sum, shipment) => {
      return sum.add(shipment.cost);
    }, new Money(0));

    const tax = subtotal.multiply(taxRate);
    const total = subtotal.add(tax);

    return {
      subtotal,
      tax,
      total
    };
  }

  static calculateBalance(total, payments) {
    return payments.reduce((balance, payment) => {
      return balance.subtract(payment.amount);
    }, total);
  }

  static calculateDueDate(creationDate, daysUntilDue = 30) {
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + daysUntilDue);
    return dueDate;
  }

  static isOverdue(dueDate, currentDate = new Date()) {
    return dueDate < currentDate;
  }
}