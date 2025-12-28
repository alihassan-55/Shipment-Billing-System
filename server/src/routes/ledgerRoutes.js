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
router.get('/', requireRoles('ADMIN'), getAllLedgerEntries);
router.post('/', requireRoles('ADMIN'), createLedgerEntry);
router.get('/summary', requireRoles('ADMIN'), getLedgerSummary);

export default router;
