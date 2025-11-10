// Unified API routes for cross-phase integration
// This provides consistent endpoints for all components

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  // Payment operations
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  recordPaymentWithLedger,
  
  // Ledger operations
  createLedgerEntry,
  getLedgerEntries,
  getCustomerLedgerEntries,
  updateLedgerEntry,
  deleteLedgerEntry,
  
  // Customer operations
  getCustomers,
  getCustomer,
  getCustomerFinancialSummary,
  getCustomerLedgerBalance,
  getCustomerInvoices,
  getCustomerShipments,
  
  // Invoice operations
  getInvoices,
  getInvoice,
  updateInvoiceStatus,
  generateInvoicePDF,
  
  // Shipment operations
  getShipments,
  getShipment,
  getShipmentInvoices,
  
  // Cross-reference operations
  createCrossReference,
  getCrossReferences,
  
  // Integrated operations
  updateInvoiceWithPayment,
  
  // Bulk operations
  bulkUpdateInvoiceStatus,
  exportFinancialData
} from '../controllers/integrationController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ===== CUSTOMER ROUTES =====
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomer);
router.get('/customers/:id/ledger-balance', getCustomerLedgerBalance);
router.get('/customers/:id/invoices', getCustomerInvoices);
router.get('/customers/:id/shipments', getCustomerShipments);
router.get('/customers/:id/financial-summary', getCustomerFinancialSummary);
router.get('/customers/:id/ledger-entries', getCustomerLedgerEntries);

// ===== PAYMENT ROUTES =====
router.post('/payments', createPayment);
router.get('/payments', getPayments);
router.get('/payments/:id', getPayment);
router.patch('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);
router.post('/payments/with-ledger', recordPaymentWithLedger);

// ===== LEDGER ROUTES =====
router.post('/ledger-entries', createLedgerEntry);
router.get('/ledger-entries', getLedgerEntries);
router.patch('/ledger-entries/:id', updateLedgerEntry);
router.delete('/ledger-entries/:id', deleteLedgerEntry);

// ===== INVOICE ROUTES =====
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoice);
router.patch('/invoices/:id/status', updateInvoiceStatus);
router.get('/invoices/:id/pdf', generateInvoicePDF);
router.post('/invoices/:id/payment', updateInvoiceWithPayment);
router.patch('/invoices/bulk-status', bulkUpdateInvoiceStatus);

// ===== SHIPMENT ROUTES =====
router.get('/shipments', getShipments);
router.get('/shipments/:id', getShipment);
router.get('/shipment-invoices/shipments/:id/invoices', getShipmentInvoices);

// ===== CROSS-REFERENCE ROUTES =====
router.post('/cross-references', createCrossReference);
router.get('/cross-references/:entityType/:entityId', getCrossReferences);

// ===== EXPORT ROUTES =====
router.get('/export/:entityType', exportFinancialData);

export default router;








