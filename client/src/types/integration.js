// Core integration types for cross-phase functionality
// This ensures consistent data structures across all components

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check',
  ONLINE_PAYMENT: 'Online Payment',
  OTHER: 'Other'
};

export const PAYMENT_STATUS = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  ADD_TO_LEDGER: 'Add to Ledger',
  PARTIAL: 'Partial'
};

export const LEDGER_ENTRY_TYPES = {
  INVOICE: 'INVOICE',
  PAYMENT: 'PAYMENT',
  ADJUSTMENT: 'ADJUSTMENT'
};

export const TRANSACTION_TYPES = {
  DEBIT: 'Debit',
  CREDIT: 'Credit'
};

// Unified reference format for all entities
export const REFERENCE_FORMATS = {
  INVOICE: (invoiceNumber) => `Invoice #${invoiceNumber}`,
  PAYMENT: (receiptNumber) => `Payment Receipt #${receiptNumber}`,
  SHIPMENT: (referenceNumber) => `Shipment #${referenceNumber}`,
  ADJUSTMENT: (adjustmentId) => `Adjustment #${adjustmentId}`
};

// Cross-reference mapping for navigation
export const ENTITY_ROUTES = {
  INVOICE: (id) => `/invoices/${id}`,
  PAYMENT: (id) => `/payments/${id}`,
  SHIPMENT: (id) => `/shipments/${id}`,
  CUSTOMER: (id) => `/customers/${id}`,
  LEDGER: (customerId) => `/ledger/${customerId}`
};

// Unified data structure for all financial transactions
export const createFinancialTransaction = (type, data) => {
  const baseTransaction = {
    id: data.id,
    date: data.date || data.createdAt,
    customerId: data.customerId,
    customerName: data.customer?.name || data.customerName,
    amount: data.amount || data.total || data.grandTotal,
    currency: 'Rs',
    reference: data.reference || data.referenceNumber || data.invoiceNumber,
    description: data.description,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };

  switch (type) {
    case 'INVOICE':
      return {
        ...baseTransaction,
        type: 'INVOICE',
        invoiceNumber: data.invoiceNumber,
        status: data.status,
        lineItems: data.lineItems || [],
        paymentStatus: data.paymentStatus || PAYMENT_STATUS.UNPAID
      };
    
    case 'PAYMENT':
      return {
        ...baseTransaction,
        type: 'PAYMENT',
        paymentMethod: data.paymentMethod || data.paymentType,
        receiptNumber: data.receiptNumber,
        relatedInvoiceId: data.invoiceId,
        relatedShipmentId: data.shipmentId,
        notes: data.notes || data.details
      };
    
    case 'LEDGER_ENTRY':
      return {
        ...baseTransaction,
        type: 'LEDGER_ENTRY',
        entryType: data.entryType,
        debit: data.debit || 0,
        credit: data.credit || 0,
        balanceAfter: data.balanceAfter,
        referenceId: data.referenceId
      };
    
    case 'SHIPMENT':
      return {
        ...baseTransaction,
        type: 'SHIPMENT',
        referenceNumber: data.referenceNumber,
        status: data.status,
        serviceProvider: data.serviceProvider,
        consignee: data.consignee,
        weight: data.actualWeightKg,
        terms: data.terms
      };
    
    default:
      return baseTransaction;
  }
};

// Unified API response structure
export const createApiResponse = (success, data, message, error = null) => ({
  success,
  data,
  message,
  error,
  timestamp: new Date().toISOString()
});

// Cross-reference validation
export const validateCrossReference = (entityType, entityId, relatedEntityType, relatedEntityId) => {
  const validReferences = {
    PAYMENT: ['INVOICE', 'SHIPMENT'],
    LEDGER_ENTRY: ['INVOICE', 'PAYMENT', 'SHIPMENT'],
    INVOICE: ['SHIPMENT'],
    SHIPMENT: ['CUSTOMER']
  };

  return validReferences[entityType]?.includes(relatedEntityType) || false;
};

// Unified currency formatting
export const formatCurrency = (amount, currency = 'Rs') => {
  if (amount === null || amount === undefined || isNaN(amount)) return `${currency} 0.00`;
  return `${currency} ${parseFloat(amount).toLocaleString('en-PK', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Unified date formatting
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Unified date-time formatting
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};


