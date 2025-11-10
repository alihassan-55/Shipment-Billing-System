import { Money } from './money.js';

export const PaymentMethod = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
  CREDIT_CARD: 'credit_card'
};

export class Payment {
  constructor(props) {
    this.amount = props.amount instanceof Money 
      ? props.amount 
      : new Money(props.amount);
    this.method = props.method;
    this.referenceNumber = props.referenceNumber;
    this.paymentDate = props.paymentDate || new Date();
    
    if (!Object.values(PaymentMethod).includes(this.method)) {
      throw new Error('Invalid payment method');
    }
  }

  toJSON() {
    return {
      amount: this.amount.toJSON(),
      method: this.method,
      referenceNumber: this.referenceNumber,
      paymentDate: this.paymentDate
    };
  }
}