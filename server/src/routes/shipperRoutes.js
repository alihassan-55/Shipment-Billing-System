import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getShippers,
  createShipper,
  getShipper
} from '../controllers/shipperController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/shippers?query=... - Search shippers with typeahead
router.get('/', getShippers);

// POST /api/shippers - Create new shipper
router.post('/', createShipper);

// GET /api/shippers/:id - Get specific shipper
router.get('/:id', getShipper);

export default router;
