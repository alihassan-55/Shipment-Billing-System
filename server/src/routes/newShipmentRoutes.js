import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipment,
  deleteShipment,
  updateAirwayBill,
  addShipmentEvent,
  confirmShipment
} from '../controllers/newShipmentController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/shipments - Create new shipment
router.post('/', createShipment);

// GET /api/shipments - Get shipments with filtering
router.get('/', getShipments);

// GET /api/shipments/:id - Get specific shipment
router.get('/:id', getShipmentById);

// PATCH /api/shipments/:id - Update shipment
router.patch('/:id', updateShipment);

// DELETE /api/shipments/:id - Delete shipment and all related records
router.delete('/:id', deleteShipment);

// PATCH /api/shipments/:id/airway-bill - Update airway bill (late-night update)
router.patch('/:id/airway-bill', updateAirwayBill);

// POST /api/shipments/:id/events - Add shipment event
router.post('/:id/events', addShipmentEvent);

// PATCH /api/shipments/:id/confirm - Confirm shipment and generate invoices
router.patch('/:id/confirm', confirmShipment);

export default router;
