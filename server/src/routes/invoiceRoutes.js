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
router.patch('/:id/status', updateInvoiceStatus);

export default router;


