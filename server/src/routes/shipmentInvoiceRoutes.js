import express from 'express';
import {
  generateShipmentInvoices,
  getShipmentInvoices,
  generateInvoicePDF,
  getInvoice,
  updateInvoiceStatus
} from '../controllers/shipmentInvoiceController.js';
import { confirmShipment } from '../controllers/newShipmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Shipment confirmation (triggers invoice creation)
router.patch('/shipments/:id/confirm', confirmShipment);

// Invoice generation for shipments
router.post('/shipments/:id/generate-invoices', generateShipmentInvoices);
router.get('/shipments/:id/invoices', getShipmentInvoices);

// Invoice management
router.get('/invoices/:id', getInvoice);
router.post('/invoices/:id/pdf', generateInvoicePDF);
router.get('/invoices/:id/pdf', generateInvoicePDF);
router.patch('/invoices/:id/status', updateInvoiceStatus);

export default router;
