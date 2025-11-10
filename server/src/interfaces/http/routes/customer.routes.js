import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { CustomerRepository } from '../../../infrastructure/repositories/customer.repository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

const router = Router();
const customerRepository = new CustomerRepository(prisma);
const customerController = new CustomerController(customerRepository);

// Create a new customer
router.post('/', customerController.createCustomer.bind(customerController));

// Update an existing customer
router.put('/:id', customerController.updateCustomer.bind(customerController));

// Get a specific customer
router.get('/:id', customerController.getCustomer.bind(customerController));

// List all customers
router.get('/', customerController.listCustomers.bind(customerController));

// Deactivate a customer
router.post('/:id/deactivate', customerController.deactivateCustomer.bind(customerController));

export default router;