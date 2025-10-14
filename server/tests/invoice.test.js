import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import { generateInvoicePDF } from '../src/utils/pdfGenerator.js';
import jwt from 'jsonwebtoken';

describe('Invoice System', () => {
  let testUser;
  let testCustomer;
  let testShipment;
  let testInvoice;
  let authToken;

  beforeAll(async () => {
    // Create test user first
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin',
      },
    });

    // Generate auth token for the test user
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test customer
    testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
      },
    });

    // Create test address
    const testAddress = await prisma.address.create({
      data: {
        customerId: testCustomer.id,
        type: 'Business',
        line1: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
      },
    });

    // Create test shipment
    testShipment = await prisma.shipment.create({
      data: {
        waybill: 'TEST-001',
        senderId: testCustomer.id,
        receiverId: testCustomer.id,
        pickupAddressId: testAddress.id,
        deliveryAddressId: testAddress.id,
        weight: 5.0,
        serviceType: 'Express',
        status: 'Delivered',
        createdById: testUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testShipment) {
      await prisma.invoiceLineItem.deleteMany({
        where: { shipmentId: testShipment.id },
      });
      await prisma.shipment.deleteMany({
        where: { id: testShipment.id },
      });
    }
    if (testCustomer) {
      await prisma.invoice.deleteMany({
        where: { customerId: testCustomer.id },
      });
      await prisma.address.deleteMany({
        where: { customerId: testCustomer.id },
      });
      await prisma.customer.deleteMany({
        where: { id: testCustomer.id },
      });
    }
    if (testUser) {
      await prisma.user.deleteMany({
        where: { id: testUser.id },
      });
    }
  });

  describe('Invoice Creation', () => {
    test('should create invoice from shipments', async () => {
      const invoiceData = {
        shipmentIds: [testShipment.id],
        customerId: testCustomer.id,
        taxRate: 0.18,
      };

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('invoiceNumber');
      expect(response.body).toHaveProperty('total');
      expect(response.body.customerId).toBe(testCustomer.id);

      testInvoice = response.body;
    });

    test('should fetch invoice details', async () => {
      const response = await request(app)
        .get(`/api/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testInvoice.id);
      expect(response.body.customer).toBeDefined();
      expect(response.body.lineItems).toBeDefined();
      expect(response.body.lineItems.length).toBeGreaterThan(0);
    });

    test('should generate PDF for invoice', async () => {
      const response = await request(app)
        .post(`/api/invoices/${testInvoice.id}/pdf`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('PDF Generation', () => {
    test('should generate PDF file', async () => {
      const pdfPath = await generateInvoicePDF(testInvoice.id);
      expect(pdfPath).toBeDefined();
      expect(pdfPath).toContain('.pdf');
    });
  });
});