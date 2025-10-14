import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getServiceProviders,
  createServiceProvider
} from '../controllers/serviceProviderController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/service-providers - Get all service providers
router.get('/', getServiceProviders);

// POST /api/service-providers - Create new service provider (admin only)
router.post('/', createServiceProvider);

export default router;
