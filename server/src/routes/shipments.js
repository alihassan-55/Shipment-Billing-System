import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createShipment, listShipments, getShipment, updateShipment } from '../controllers/shipment.controller.js';

export const shipmentsRouter = Router();

shipmentsRouter.use(authMiddleware());

shipmentsRouter.post('/', createShipment);
shipmentsRouter.get('/', listShipments);
shipmentsRouter.get('/:id', getShipment);
shipmentsRouter.put('/:id', updateShipment);
