// Database cleanup script - Remove all invoices and ledger entries
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Delete all ledger entries first (they reference invoices)
    console.log('Deleting all ledger entries...');
    const deletedLedgerEntries = await prisma.ledgerEntry.deleteMany({});
    console.log(`Deleted ${deletedLedgerEntries.count} ledger entries`);
    
    // Delete from ledger_entries table (with underscore) if it exists
    try {
      const deletedLedgerEntriesUnderscore = await prisma.ledger_entries.deleteMany({});
      console.log(`Deleted ${deletedLedgerEntriesUnderscore.count} ledger entries (underscore table)`);
    } catch (error) {
      console.log('ledger_entries table not found or already empty');
    }
    
    // Delete all shipment invoice line items
    console.log('Deleting all shipment invoice line items...');
    const deletedLineItems = await prisma.shipment_invoice_line_items.deleteMany({});
    console.log(`Deleted ${deletedLineItems.count} shipment invoice line items`);
    
    // Delete all shipment invoices
    console.log('Deleting all shipment invoices...');
    const deletedShipmentInvoices = await prisma.shipment_invoices.deleteMany({});
    console.log(`Deleted ${deletedShipmentInvoices.count} shipment invoices`);
    
    // Delete all invoice line items first (they reference main invoices)
    console.log('Deleting all invoice line items...');
    const deletedInvoiceLineItems = await prisma.invoiceLineItem.deleteMany({});
    console.log(`Deleted ${deletedInvoiceLineItems.count} invoice line items`);
    
    // Delete all main invoices
    console.log('Deleting all main invoices...');
    const deletedMainInvoices = await prisma.invoice.deleteMany({});
    console.log(`Deleted ${deletedMainInvoices.count} main invoices`);
    
    // Delete all billing invoices
    console.log('Deleting all billing invoices...');
    const deletedBillingInvoices = await prisma.billing_invoices.deleteMany({});
    console.log(`Deleted ${deletedBillingInvoices.count} billing invoices`);
    
    // Delete all product invoice items
    console.log('Deleting all product invoice items...');
    const deletedProductItems = await prisma.product_invoice_items.deleteMany({});
    console.log(`Deleted ${deletedProductItems.count} product invoice items`);
    
    // Delete all payments
    console.log('Deleting all payments...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`Deleted ${deletedPayments.count} payments`);
    
    // Delete all shipment events
    console.log('Deleting all shipment events...');
    const deletedEvents = await prisma.ShipmentEvent.deleteMany({});
    console.log(`Deleted ${deletedEvents.count} shipment events`);
    
    // Delete all shipment boxes
    console.log('Deleting all shipment boxes...');
    const deletedBoxes = await prisma.shipment_boxes.deleteMany({});
    console.log(`Deleted ${deletedBoxes.count} shipment boxes`);
    
    // Delete all shipments
    console.log('Deleting all shipments...');
    const deletedShipments = await prisma.shipments.deleteMany({});
    console.log(`Deleted ${deletedShipments.count} shipments`);
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('All invoices, ledger entries, shipments, and related data have been removed.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase();
