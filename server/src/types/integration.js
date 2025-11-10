// server/src/types/integration.js
// Server-side integration types and constants
// This mirrors the client-side types but is optimized for server use

// --- Constants for Payment Methods ---
export const PAYMENT_METHODS = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check',
  ONLINE_PAYMENT: 'Online Payment',
  CREDIT: 'Credit',
  OTHER: 'Other',
};

// --- Constants for Invoice Statuses ---
export const INVOICE_STATUSES = {
  DRAFT: 'DRAFT',
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  ADD_TO_LEDGER: 'ADD_TO_LEDGER',
};

// --- Constants for Ledger Entry Types ---
export const LEDGER_ENTRY_TYPES = {
  INVOICE: 'INVOICE',
  PAYMENT: 'PAYMENT',
  ADJUSTMENT: 'ADJUSTMENT',
  SHIPMENT_CREDIT: 'SHIPMENT_CREDIT', // For partial cash payments
};

// --- Constants for Payment Status ---
export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  ADD_TO_LEDGER: 'ADD_TO_LEDGER',
};

// --- Reference Format Functions ---
export const REFERENCE_FORMATS = {
  INVOICE: (invoiceNumber) => `Invoice #${invoiceNumber}`,
  PAYMENT: (receiptNumber) => `Payment Receipt #${receiptNumber}`,
  SHIPMENT: (shipmentRef) => `Shipment #${shipmentRef}`,
  ADJUSTMENT: (adjustmentId) => `Adjustment #${adjustmentId}`,
};

// --- Financial Transaction Factory (for consistent data structures) ---
export const createLedgerEntryData = ({
  customerId,
  referenceId,
  entryType,
  description,
  debit = 0,
  credit = 0,
  balanceAfter = 0, // This should be calculated on the backend
  recordedBy = 'system', // Default to system if not provided
}) => ({
  customerId,
  referenceId,
  entryType,
  description,
  debit,
  credit,
  balanceAfter,
  recordedBy,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// --- Cross-reference Validation (example) ---
export const validatePaymentToInvoiceLink = (paymentAmount, invoiceTotal, invoicePaidAmount) => {
  if (paymentAmount > (invoiceTotal - invoicePaidAmount)) {
    return { isValid: false, message: "Payment amount exceeds remaining invoice balance." };
  }
  return { isValid: true };
};

// --- Unified Formatting Functions ---
export const formatCurrencyRs = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rs 0.00';
  }
  return `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatShortDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- Business Logic Constants ---
export const BUSINESS_RULES = {
  // Minimum amounts
  MIN_PAYMENT_AMOUNT: 1,
  MIN_INVOICE_AMOUNT: 1,
  
  // Status transitions
  ALLOWED_STATUS_TRANSITIONS: {
    DRAFT: ['UNPAID', 'PAID', 'ADD_TO_LEDGER'],
    UNPAID: ['PARTIAL', 'PAID', 'ADD_TO_LEDGER'],
    PARTIAL: ['PAID', 'ADD_TO_LEDGER'],
    PAID: [], // Final state
    ADD_TO_LEDGER: [], // Final state
  },
  
  // Payment method restrictions
  PAYMENT_METHOD_RESTRICTIONS: {
    CASH: { requiresReceipt: true },
    BANK_TRANSFER: { requiresReference: true },
    CHECK: { requiresReference: true },
    CREDIT: { requiresLedgerEntry: true },
  },
};

// --- Error Messages ---
export const ERROR_MESSAGES = {
  INVALID_PAYMENT_AMOUNT: 'Payment amount must be greater than 0',
  INVALID_INVOICE_STATUS: 'Invalid invoice status transition',
  CUSTOMER_NOT_FOUND: 'Customer not found',
  INVOICE_NOT_FOUND: 'Invoice not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  SHIPMENT_NOT_FOUND: 'Shipment not found',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation',
  DUPLICATE_REFERENCE: 'Reference number already exists',
  INVALID_DATE_RANGE: 'Invalid date range provided',
};








