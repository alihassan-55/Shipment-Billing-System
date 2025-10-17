// File: ledgerRoutes.js
// Purpose: API routes for ledger management and customer financial tracking
// Dependencies: ledgerController.js, auth middleware

import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import {
  getCustomerLedger,
  getAllLedgerEntries,
  createLedgerEntry,
  getLedgerSummary,
} from '../controllers/ledgerController.js';

const router = Router();

router.use(requireAuth);

// Ledger management routes
router.get('/customer/:customerId', getCustomerLedger);
router.get('/', requireRoles('admin', 'accountant'), getAllLedgerEntries);
router.post('/', requireRoles('admin', 'accountant'), createLedgerEntry);
router.get('/summary', requireRoles('admin', 'accountant'), getLedgerSummary);

export default router;
