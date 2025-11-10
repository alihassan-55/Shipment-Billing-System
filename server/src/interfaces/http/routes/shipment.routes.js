import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller.js';
import { ShipmentRepository } from '../../../infrastructure/repositories/shipment.repository.js';
import { CustomerRepository } from '../../../infrastructure/repositories/customer.repository.js';
import { ConsigneeRepository } from '../../../infrastructure/repositories/consignee.repository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

const router = Router();

const shipmentRepository = new ShipmentRepository(prisma);
const customerRepository = new CustomerRepository(prisma);
const consigneeRepository = new ConsigneeRepository(prisma);

const shipmentController = new ShipmentController(
  shipmentRepository,
  customerRepository,
  consigneeRepository
);

// Create a new shipment
router.post('/', shipmentController.createShipment.bind(shipmentController));

// Update shipment status
router.patch('/:id/status', shipmentController.updateStatus.bind(shipmentController));

// Get shipment by ID
router.get('/:id', shipmentController.getShipment.bind(shipmentController));

// Track shipment by tracking number
router.get('/track/:trackingNumber', shipmentController.trackShipment.bind(shipmentController));

// List customer's shipments
router.get('/customer/:customerId', shipmentController.listCustomerShipments.bind(shipmentController));

// Get customer's shipments available for invoicing
router.get('/customer/:customerId/for-invoicing', shipmentController.getShipmentsForInvoicing.bind(shipmentController));

export default router;