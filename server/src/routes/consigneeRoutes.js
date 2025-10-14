import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getConsignees,
  createConsignee,
  getConsignee
} from '../controllers/consigneeController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/consignees?query=... - Search consignees with typeahead
router.get('/', getConsignees);

// POST /api/consignees - Create new consignee
router.post('/', createConsignee);

// GET /api/consignees/:id - Get specific consignee
router.get('/:id', getConsignee);

export default router;
