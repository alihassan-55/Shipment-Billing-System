import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShipmentInvoiceService } from '../src/services/shipmentInvoiceService.js';

// Mock Prisma client
const mockPrisma = {
  $transaction: vi.fn(),
  shipment_invoices: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn()
  },
  shipments: {
    findUnique: vi.fn()
  },
  ledger_entries: {
    create: vi.fn()
  }
};

// Mock the prisma import
vi.mock('../src/db/client.js', () => ({
  prisma: mockPrisma
}));

describe('ShipmentInvoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createForShipment', () => {
    it('should create both declared value and billing invoices for a confirmed shipment', async () => {
      const mockShipment = {
        id: 'shipment-1',
        status: 'Confirmed',
        shippers: {
          id: 'shipper-1',
          personName: 'John Doe',
          cnic: '12345-1234567-1',
          ntn: 'NTN123456'
        },
        consignees: {
          id: 'consignee-1',
          personName: 'Jane Smith'
        },
        service_providers: {
          id: 'provider-1',
          name: 'Test Provider'
        },
        product_invoice_items: [
          {
            description: 'Test Product',
            pieces: 2,
            unitValue: 100,
            total: 200
          }
        ],
        billing_invoices: {
          ratePerKg: 50,
          totalRate: 500,
          eFormCharges: 10,
          remoteAreaCharges: 20,
          boxCharges: 30,
          grandTotal: 560,
          paymentMethod: 'Cash',
          customerAccountId: 'customer-1'
        },
        shipment_boxes: [],
        actualWeightKg: 10,
        volumeWeightKg: 8,
        chargedWeightKg: 10
      };

      mockPrisma.shipments.findUnique.mockResolvedValue(mockShipment);
      mockPrisma.shipment_invoices.findMany.mockResolvedValue([]);
      mockPrisma.shipment_invoices.count.mockResolvedValue(0);
      mockPrisma.shipment_invoices.create.mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'DV-2025-000001',
        type: 'DECLARED_VALUE',
        total: 200
      });

      const result = await ShipmentInvoiceService.createForShipment('shipment-1');

      expect(result).toHaveProperty('declaredValueInvoice');
      expect(result).toHaveProperty('billingInvoice');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error for non-confirmed shipment', async () => {
      const mockShipment = {
        id: 'shipment-1',
        status: 'Draft'
      };

      mockPrisma.shipments.findUnique.mockResolvedValue(mockShipment);

      await expect(ShipmentInvoiceService.createForShipment('shipment-1'))
        .rejects.toThrow('Can only create invoices for confirmed shipments');
    });

    it('should return existing invoices if they already exist', async () => {
      const mockShipment = {
        id: 'shipment-1',
        status: 'Confirmed'
      };

      const existingInvoices = [
        { id: 'invoice-1', type: 'DECLARED_VALUE' },
        { id: 'invoice-2', type: 'BILLING' }
      ];

      mockPrisma.shipments.findUnique.mockResolvedValue(mockShipment);
      mockPrisma.shipment_invoices.findMany.mockResolvedValue(existingInvoices);

      const result = await ShipmentInvoiceService.createForShipment('shipment-1');

      expect(result.declaredValueInvoice).toEqual(existingInvoices[0]);
      expect(result.billingInvoice).toEqual(existingInvoices[1]);
    });
  });

  describe('getShipmentInvoices', () => {
    it('should return invoices for a shipment', async () => {
      const mockInvoices = [
        { id: 'invoice-1', type: 'DECLARED_VALUE' },
        { id: 'invoice-2', type: 'BILLING' }
      ];

      mockPrisma.shipment_invoices.findMany.mockResolvedValue(mockInvoices);

      const result = await ShipmentInvoiceService.getShipmentInvoices('shipment-1');

      expect(result).toEqual(mockInvoices);
      expect(mockPrisma.shipment_invoices.findMany).toHaveBeenCalledWith({
        where: { shipmentId: 'shipment-1' },
        include: { lineItems: true },
        orderBy: { createdAt: 'asc' }
      });
    });
  });
});










