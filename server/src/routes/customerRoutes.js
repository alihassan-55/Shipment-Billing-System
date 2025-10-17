import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  // Shipper functions
  getShippers,
  createShipper,
  getShipper,
  searchShippersByPhone,
} from '../controllers/customerController.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRoles('admin', 'operator'), createCustomer);
router.get('/', getCustomers);
router.get('/search', getCustomers); // Add search endpoint for autocomplete
router.get('/:id', getCustomer);
router.put('/:id', requireRoles('admin', 'operator'), updateCustomer);
router.delete('/:id', requireRoles('admin'), deleteCustomer);

// Shipper-specific routes (for backward compatibility)
router.get('/shippers/search-by-phone', searchShippersByPhone);
router.get('/shippers', getShippers);
router.post('/shippers', requireRoles('admin', 'operator'), createShipper);
router.get('/shippers/:id', getShipper);

export default router;


