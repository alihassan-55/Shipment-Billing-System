export class Money {
  constructor(amount, currency = 'PKR') {
    this.amount = Number(amount);
    this.currency = currency;
    
    if (isNaN(this.amount)) {
      throw new Error('Invalid amount');
    }
  }

  add(money) {
    if (!(money instanceof Money)) {
      throw new Error('Can only add Money instances');
    }
    if (this.currency !== money.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + money.amount, this.currency);
  }

  subtract(money) {
    if (!(money instanceof Money)) {
      throw new Error('Can only subtract Money instances');
    }
    if (this.currency !== money.currency) {
      throw new Error('Cannot subtract different currencies');
    }
    return new Money(this.amount - money.amount, this.currency);
  }

  multiply(factor) {
    return new Money(this.amount * factor, this.currency);
  }

  equals(money) {
    if (!(money instanceof Money)) return false;
    return this.amount === money.amount && this.currency === money.currency;
  }

  format() {
    return this.currency === 'PKR' 
      ? `Rs. ${this.amount.toFixed(2)}`
      : `${this.currency} ${this.amount.toFixed(2)}`;
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency
    };
  }
}