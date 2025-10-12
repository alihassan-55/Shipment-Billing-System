import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  generateInvoicePDFEndpoint,
} from '../controllers/invoiceController.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRoles('admin', 'accountant'), createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/:id/generate-pdf', requireRoles('admin', 'accountant'), generateInvoicePDFEndpoint);

export default router;


