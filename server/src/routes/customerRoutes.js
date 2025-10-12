import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
} from '../controllers/customerController.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRoles('admin', 'operator'), createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.put('/:id', requireRoles('admin', 'operator'), updateCustomer);

export default router;


