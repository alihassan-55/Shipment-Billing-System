import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import shipmentRoutes from './shipment.routes';
import invoiceRoutes from '../controllers/invoice.controller';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/invoices', invoiceRoutes);

export default router;