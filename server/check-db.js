// Test database content
import { prisma } from './src/db/client.js';

async function checkDatabase() {
  try {
    console.log('Checking database content...');
    
    // Check main invoices
    const invoices = await prisma.invoice.findMany();
    console.log('Main invoices:', invoices.length);
    if (invoices.length > 0) {
      console.log('Sample invoice:', {
        id: invoices[0].id,
        invoiceNumber: invoices[0].invoiceNumber,
        customerId: invoices[0].customerId,
        total: invoices[0].total,
        status: invoices[0].status
      });
    }
    
    // Check shipment invoices
    const shipmentInvoices = await prisma.shipment_invoices.findMany();
    console.log('Shipment invoices:', shipmentInvoices.length);
    if (shipmentInvoices.length > 0) {
      console.log('Sample shipment invoice:', {
        id: shipmentInvoices[0].id,
        invoiceNumber: shipmentInvoices[0].invoiceNumber,
        shipmentId: shipmentInvoices[0].shipmentId,
        total: shipmentInvoices[0].total,
        status: shipmentInvoices[0].status
      });
    }
    
    // Check customers
    const customers = await prisma.customer.findMany();
    console.log('Customers:', customers.length);
    
    // Check shipments
    const shipments = await prisma.shipments.findMany();
    console.log('Shipments:', shipments.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
