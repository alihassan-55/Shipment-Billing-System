import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import { recordPayment, getPayments } from '../controllers/paymentController.js';

const router = Router();

router.use(requireAuth);

// Payment management routes
router.post('/', requireRoles('ADMIN'), recordPayment);
router.get('/', getPayments);

export default router;


