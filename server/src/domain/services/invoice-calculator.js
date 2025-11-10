import { Money } from '../value-objects/money';

export class InvoiceCalculator {
  static calculateTotals(shipments) {
    const subtotal = shipments.reduce((sum, shipment) => 
      sum.add(shipment.charge), Money.zero());
    
    const tax = this._calculateTax(subtotal);
    const total = subtotal.add(tax);

    return {
      subtotal,
      tax,
      total
    };
  }

  static _calculateTax(amount, taxRate = 0.16) { // 16% GST
    return amount.multiply(taxRate);
  }

  static calculateBalance(total, payments) {
    const totalPaid = payments.reduce((sum, payment) => 
      sum.add(payment.amount), Money.zero());
    
    return total.subtract(totalPaid);
  }

  static calculateDueDate(issueDate, gracePeriod = 30) {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + gracePeriod);
    return dueDate;
  }

  static isOverdue(invoice) {
    return invoice.dueDate < new Date() && invoice.status !== 'PAID';
  }
}