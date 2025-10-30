// Safe database cleanup script - Shows what will be deleted before actually deleting
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function previewCleanup() {
  try {
    console.log('🔍 Previewing database cleanup...\n');
    
    // Count all records
    const [
      ledgerEntriesCount,
      ledgerEntriesUnderscoreCount,
      lineItemsCount,
      shipmentInvoicesCount,
      invoiceLineItemsCount,
      mainInvoicesCount,
      billingInvoicesCount,
      productItemsCount,
      paymentsCount,
      eventsCount,
      boxesCount,
      shipmentsCount
    ] = await Promise.all([
      prisma.ledgerEntry.count(),
      prisma.ledger_entries.count().catch(() => 0),
      prisma.shipment_invoice_line_items.count(),
      prisma.shipment_invoices.count(),
      prisma.invoiceLineItem.count(),
      prisma.invoice.count(),
      prisma.billing_invoices.count(),
      prisma.product_invoice_items.count(),
      prisma.payment.count(),
      prisma.ShipmentEvent.count(),
      prisma.shipment_boxes.count(),
      prisma.shipments.count()
    ]);
    
    console.log('📊 Records to be deleted:');
    console.log(`   Ledger Entries: ${ledgerEntriesCount}`);
    console.log(`   Ledger Entries (underscore): ${ledgerEntriesUnderscoreCount}`);
    console.log(`   Shipment Invoice Line Items: ${lineItemsCount}`);
    console.log(`   Shipment Invoices: ${shipmentInvoicesCount}`);
    console.log(`   Invoice Line Items: ${invoiceLineItemsCount}`);
    console.log(`   Main Invoices: ${mainInvoicesCount}`);
    console.log(`   Billing Invoices: ${billingInvoicesCount}`);
    console.log(`   Product Invoice Items: ${productItemsCount}`);
    console.log(`   Payments: ${paymentsCount}`);
    console.log(`   Shipment Events: ${eventsCount}`);
    console.log(`   Shipment Boxes: ${boxesCount}`);
    console.log(`   Shipments: ${shipmentsCount}`);
    
    const totalRecords = ledgerEntriesCount + ledgerEntriesUnderscoreCount + lineItemsCount + 
                        shipmentInvoicesCount + invoiceLineItemsCount + mainInvoicesCount + 
                        billingInvoicesCount + productItemsCount + paymentsCount + eventsCount + 
                        boxesCount + shipmentsCount;
    
    console.log(`\n📈 Total records to be deleted: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('\n✅ Database is already clean! No records to delete.');
    } else {
      console.log('\n⚠️  WARNING: This will permanently delete all the above records!');
      console.log('   To proceed with deletion, run: node cleanup-database.js');
    }
    
  } catch (error) {
    console.error('❌ Error during preview:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the preview
previewCleanup();
