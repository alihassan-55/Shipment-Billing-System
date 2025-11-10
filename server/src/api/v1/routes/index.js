import { Router } from 'express';
import authRoutes from './auth.routes.js';
import shipmentRoutes from './shipment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/shipments', shipmentRoutes);
// Add other routes here as they are created

export default router;