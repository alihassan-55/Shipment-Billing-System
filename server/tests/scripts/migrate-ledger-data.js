// File: migrate-ledger-data.js
// Purpose: Migrate existing ledger_entries data to new LedgerEntry model
// Dependencies: prisma client

import { prisma } from './src/db/client.js';

async function migrateLedgerData() {
  console.log('Starting ledger data migration...');
  
  try {
    // Get existing ledger entries
    const existingEntries = await prisma.$queryRaw`
      SELECT * FROM ledger_entries
    `;
    
    console.log(`Found ${existingEntries.length} existing ledger entries`);
    
    if (existingEntries.length === 0) {
      console.log('No data to migrate');
      return;
    }
    
    // Migrate each entry
    for (const entry of existingEntries) {
      try {
        // Create new LedgerEntry
        await prisma.ledgerEntry.create({
          data: {
            id: entry.id,
            customerId: entry.customerAccountId,
            referenceId: entry.shipmentId, // Map shipmentId to referenceId
            entryType: 'INVOICE', // Default type
            description: `Migrated ledger entry for shipment ${entry.shipmentId}`,
            debit: entry.amount > 0 ? entry.amount : 0,
            credit: entry.amount < 0 ? Math.abs(entry.amount) : 0,
            balanceAfter: entry.amount, // This will be recalculated later
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
          }
        });
        
        console.log(`Migrated ledger entry: ${entry.id}`);
      } catch (error) {
        console.error(`Error migrating entry ${entry.id}:`, error);
      }
    }
    
    console.log('Ledger data migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateLedgerData()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateLedgerData };
