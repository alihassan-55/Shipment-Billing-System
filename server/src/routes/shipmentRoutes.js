import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import {
  createShipment,
  getShipments,
  getShipment,
  updateShipment,
  addShipmentEvent,
} from '../controllers/shipmentController.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRoles('admin', 'operator'), createShipment);
router.get('/', getShipments);
router.get('/:id', getShipment);
router.put('/:id', requireRoles('admin', 'operator'), updateShipment);
router.post('/:id/events', requireRoles('admin', 'operator'), addShipmentEvent);

export default router;


