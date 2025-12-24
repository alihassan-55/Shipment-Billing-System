
import { generateInvoicePDF } from './src/utils/pdfGenerator.js';
import crypto from 'crypto';
import 'dotenv/config';

// Mock Invoice Data matching schema
const mockInvoice = {
    id: crypto.randomUUID(),
    invoiceNumber: 'TEST-INV-001',
    type: 'BILLING',
    customerAccountId: 'ACCT-123',
    subtotal: 1000,
    tax: 0,
    total: 1000,
    currency: 'Rs',
    status: 'UNPAID',
    createdAt: new Date(),
    lineItems: [
        {
            description: 'Freight Charges',
            quantity: 1,
            unitPrice: 1000,
            total: 1000
        }
    ],
    shipments: {
        referenceNumber: 'REF-SHIP-001',
        chargedWeightKg: 10,
        originCity: 'Lahore',
        destinationCity: 'Karachi',
        shipperName: 'Ali Hassan', // Fallback for shipper/receiver if relations empty
        receiverName: 'John Doe',
        pieces: 1,
        Customer: {
            name: 'Test Customer Company',
            address: '123 Test St',
            phone: '123-456-7890'
        },
        consignees: [],
        service_providers: []
    }
};

async function testGen() {
    console.log('Testing PDF Generation with mock data...');
    try {
        const url = await generateInvoicePDF(mockInvoice.id, 'BILLING', mockInvoice);
        console.log('✅ PDF Generation Successful!');
        console.log('Uploaded URL:', url);
    } catch (err) {
        console.error('❌ PDF Generation Failed:', err);
    }
}

testGen();
