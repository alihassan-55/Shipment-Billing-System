import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller.js';
import { ShipmentService } from '../../../domain/services/shipment.service.js';
import { ShipmentRepository } from '../../../infrastructure/repositories/shipment.repository.js';
import { CustomerRepository } from '../../../infrastructure/repositories/customer.repository.js';
import { ConsigneeRepository } from '../../../infrastructure/repositories/consignee.repository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

const router = Router();

const shipmentRepository = new ShipmentRepository(prisma);
const customerRepository = new CustomerRepository(prisma);
const consigneeRepository = new ConsigneeRepository(prisma);

const shipmentService = new ShipmentService(
  shipmentRepository,
  customerRepository,
  consigneeRepository
);

const shipmentController = new ShipmentController(shipmentService);

router.post('/', shipmentController.createShipment.bind(shipmentController));
router.patch('/:id/status', shipmentController.updateStatus.bind(shipmentController));
router.get('/customer/:customerId', shipmentController.getCustomerShipments.bind(shipmentController));
router.get('/customer/:customerId/invoiceable', shipmentController.getInvoiceableShipments.bind(shipmentController));

export default router;