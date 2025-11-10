class InvoiceUseCaseError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

export class CreateInvoiceUseCase {
  constructor(invoiceRepository, customerRepository, shipmentRepository) {
    this.invoiceRepository = invoiceRepository;
    this.customerRepository = customerRepository;
    this.shipmentRepository = shipmentRepository;
  }

  async execute({ customerId, shipmentIds }) {
    try {
      // Validate customer exists
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new InvoiceUseCaseError('Customer not found', 'NOT_FOUND');
      }

      // Validate shipments exist and belong to customer
      const shipments = await Promise.all(
        shipmentIds.map(id => this.shipmentRepository.findById(id))
      );

      const invalidShipments = shipments.filter(s => !s || s.customerId !== customerId);
      if (invalidShipments.length > 0) {
        throw new InvoiceUseCaseError(
          'One or more shipments are invalid or do not belong to the customer',
          'VALIDATION_ERROR'
        );
      }

      // Generate invoice number
      const number = await this.invoiceRepository.generateInvoiceNumber();

      // Create invoice
      const invoice = await this.invoiceRepository.create({
        customerId,
        number,
        shipments,
        status: 'DRAFT'
      });

      return {
        success: true,
        data: invoice.toJSON()
      };
    } catch (error) {
      if (error instanceof InvoiceUseCaseError) {
        throw error;
      }
      throw new InvoiceUseCaseError(
        'Failed to create invoice: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class GetInvoiceUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute(id) {
    try {
      const invoice = await this.invoiceRepository.findById(id);
      if (!invoice) {
        throw new InvoiceUseCaseError('Invoice not found', 'NOT_FOUND');
      }

      return {
        success: true,
        data: invoice.toJSON()
      };
    } catch (error) {
      if (error instanceof InvoiceUseCaseError) {
        throw error;
      }
      throw new InvoiceUseCaseError(
        'Failed to get invoice: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class ListCustomerInvoicesUseCase {
  constructor(invoiceRepository, customerRepository) {
    this.invoiceRepository = invoiceRepository;
    this.customerRepository = customerRepository;
  }

  async execute(customerId, filters = {}) {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new InvoiceUseCaseError('Customer not found', 'NOT_FOUND');
      }

      const invoices = await this.invoiceRepository.findByCustomer(customerId, filters);

      return {
        success: true,
        data: invoices.map(invoice => invoice.toJSON())
      };
    } catch (error) {
      if (error instanceof InvoiceUseCaseError) {
        throw error;
      }
      throw new InvoiceUseCaseError(
        'Failed to list customer invoices: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class AddPaymentUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute(invoiceId, paymentData) {
    try {
      const invoice = await this.invoiceRepository.findById(invoiceId);
      if (!invoice) {
        throw new InvoiceUseCaseError('Invoice not found', 'NOT_FOUND');
      }

      if (!paymentData.amount || !paymentData.method) {
        throw new InvoiceUseCaseError(
          'Payment amount and method are required',
          'VALIDATION_ERROR'
        );
      }

      invoice.addPayment(paymentData);
      const updated = await this.invoiceRepository.update(invoice);

      return {
        success: true,
        data: updated.toJSON()
      };
    } catch (error) {
      if (error instanceof InvoiceUseCaseError) {
        throw error;
      }
      throw new InvoiceUseCaseError(
        'Failed to add payment: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class IssueInvoiceUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute(invoiceId) {
    try {
      const invoice = await this.invoiceRepository.findById(invoiceId);
      if (!invoice) {
        throw new InvoiceUseCaseError('Invoice not found', 'NOT_FOUND');
      }

      invoice.issue();
      const updated = await this.invoiceRepository.update(invoice);

      return {
        success: true,
        data: updated.toJSON()
      };
    } catch (error) {
      if (error instanceof InvoiceUseCaseError) {
        throw error;
      }
      throw new InvoiceUseCaseError(
        'Failed to issue invoice: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class VoidInvoiceUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute(invoiceId) {
    try {
      const invoice = await this.invoiceRepository.findById(invoiceId);
      if (!invoice) {
        throw new InvoiceUseCaseError('Invoice not found', 'NOT_FOUND');
      }

      invoice.void();
      const updated = await this.invoiceRepository.update(invoice);

      return {
        success: true,
        data: updated.toJSON()
      };
    } catch (error) {
      if (error instanceof InvoiceUseCaseError) {
        throw error;
      }
      throw new InvoiceUseCaseError(
        'Failed to void invoice: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

// Export error class for use in controllers
export { InvoiceUseCaseError };