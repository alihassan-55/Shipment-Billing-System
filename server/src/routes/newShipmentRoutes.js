import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createShipment,
  getShipments,
  getShipment,
  updateShipment,
  updateAirwayBill,
  getAirwayBillStatus,
  addShipmentEvent
} from '../controllers/newShipmentController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/shipments - Create new shipment
router.post('/', createShipment);

// GET /api/shipments - Get shipments with filtering
router.get('/', getShipments);

// GET /api/shipments/:id - Get specific shipment
router.get('/:id', getShipment);

// PATCH /api/shipments/:id - Update shipment
router.patch('/:id', updateShipment);

// PATCH /api/shipments/:id/airway-bill - Update airway bill (late-night update)
router.patch('/:id/airway-bill', updateAirwayBill);

// GET /api/shipments/:id/airway-bill/status - Get airway bill status
router.get('/:id/airway-bill/status', getAirwayBillStatus);

// POST /api/shipments/:id/events - Add shipment event
router.post('/:id/events', addShipmentEvent);

export default router;
