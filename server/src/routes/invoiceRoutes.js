import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  generateInvoicePDFEndpoint,
  createInvoiceFromShipments,
  updateInvoiceStatus,
} from '../controllers/invoiceController.js';

const router = Router();

router.use(requireAuth);

// Invoice management routes
router.post('/', requireRoles('admin', 'accountant'), createInvoice);
router.post('/from-shipments', requireRoles('admin', 'accountant'), createInvoiceFromShipments);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/:id/generate-pdf', requireRoles('admin', 'accountant'), generateInvoicePDFEndpoint);
router.post('/:id/pdf', requireRoles('admin', 'accountant'), generateInvoicePDFEndpoint);
router.patch('/:id/status', updateInvoiceStatus);

// Handle OPTIONS request for PDF endpoint
router.options('/:id/pdf', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

export default router;


