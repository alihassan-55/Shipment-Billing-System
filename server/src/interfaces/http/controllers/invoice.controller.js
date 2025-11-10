import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CustomerRepository } from '../../infrastructure/repositories/prisma/customer.repository';
import { ShipmentRepository } from '../../infrastructure/repositories/prisma/shipment.repository';
import { PrismaInvoiceRepository } from '../../infrastructure/repositories/prisma/invoice.repository';
import {
  CreateInvoiceUseCase,
  GetInvoiceUseCase,
  ListCustomerInvoicesUseCase,
  AddPaymentUseCase,
  IssueInvoiceUseCase,
  VoidInvoiceUseCase,
  InvoiceUseCaseError
} from '../../application/use-cases/invoice.use-cases';

const router = Router();
const invoiceRepository = new PrismaInvoiceRepository();
const customerRepository = new CustomerRepository();
const shipmentRepository = new ShipmentRepository();

// Input validation schemas
const createInvoiceSchema = {
  type: 'object',
  required: ['customerId', 'shipmentIds'],
  properties: {
    customerId: { type: 'string', format: 'uuid' },
    shipmentIds: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      minItems: 1
    }
  }
};

const addPaymentSchema = {
  type: 'object',
  required: ['amount', 'method'],
  properties: {
    amount: { type: 'number', minimum: 0 },
    method: { type: 'string', enum: ['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD'] },
    reference: { type: 'string' }
  }
};

// Error handler middleware
const handleInvoiceError = (error, res) => {
  if (error instanceof InvoiceUseCaseError) {
    switch (error.code) {
      case 'NOT_FOUND':
        return res.status(404).json({ success: false, error: error.message });
      case 'VALIDATION_ERROR':
        return res.status(400).json({ success: false, error: error.message });
      default:
        return res.status(500).json({ success: false, error: error.message });
    }
  }
  return res.status(500).json({ 
    success: false, 
    error: 'An unexpected error occurred'
  });
};

// Routes
router.post('/',
  authenticate,
  validate(createInvoiceSchema),
  async (req, res) => {
    try {
      const useCase = new CreateInvoiceUseCase(
        invoiceRepository,
        customerRepository,
        shipmentRepository
      );
      const result = await useCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      handleInvoiceError(error, res);
    }
  }
);

router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const useCase = new GetInvoiceUseCase(invoiceRepository);
      const result = await useCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      handleInvoiceError(error, res);
    }
  }
);

router.get('/customer/:customerId',
  authenticate,
  async (req, res) => {
    try {
      const useCase = new ListCustomerInvoicesUseCase(
        invoiceRepository,
        customerRepository
      );
      const result = await useCase.execute(
        req.params.customerId,
        req.query
      );
      res.json(result);
    } catch (error) {
      handleInvoiceError(error, res);
    }
  }
);

router.post('/:id/payments',
  authenticate,
  validate(addPaymentSchema),
  async (req, res) => {
    try {
      const useCase = new AddPaymentUseCase(invoiceRepository);
      const result = await useCase.execute(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      handleInvoiceError(error, res);
    }
  }
);

router.post('/:id/issue',
  authenticate,
  async (req, res) => {
    try {
      const useCase = new IssueInvoiceUseCase(invoiceRepository);
      const result = await useCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      handleInvoiceError(error, res);
    }
  }
);

router.post('/:id/void',
  authenticate,
  async (req, res) => {
    try {
      const useCase = new VoidInvoiceUseCase(invoiceRepository);
      const result = await useCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      handleInvoiceError(error, res);
    }
  }
);

export default router;