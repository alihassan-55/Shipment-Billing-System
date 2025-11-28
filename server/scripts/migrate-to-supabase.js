import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const localDbUrl = process.env.DATABASE_URL;
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;

if (!localDbUrl || !supabaseDbUrl) {
    console.error('Error: DATABASE_URL and SUPABASE_DATABASE_URL must be set in .env');
    process.exit(1);
}

console.log('Initializing Prisma Clients...');
console.log('Local DB:', localDbUrl);
console.log('Supabase DB:', supabaseDbUrl.replace(/:[^:@]*@/, ':****@')); // Hide password

const localPrisma = new PrismaClient({
    datasources: { db: { url: localDbUrl } },
});

const supabasePrisma = new PrismaClient({
    datasources: { db: { url: supabaseDbUrl } },
});

async function migrateTable(modelName, dependencyName = null) {
    console.log(`Migrating ${modelName}...`);
    try {
        const data = await localPrisma[modelName].findMany();
        console.log(`Found ${data.length} records in local ${modelName}`);

        if (data.length === 0) return;

        // Insert in chunks to avoid packet size limits
        const chunkSize = 50;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);

            // For tables with foreign keys, we might need to handle potential conflicts or missing parents
            // But assuming we run in order, it should be fine.
            // Using createMany is faster but skipDuplicates is useful
            await supabasePrisma[modelName].createMany({
                data: chunk,
                skipDuplicates: true,
            });
        }
        console.log(`Migrated ${modelName} successfully.`);
    } catch (error) {
        console.error(`Error migrating ${modelName}:`, error.message);
        // Don't throw, try to continue with other tables if possible, but usually this is fatal for dependent tables
    }
}

async function main() {
    try {
        // 1. Independent Tables
        await migrateTable('user');
        await migrateTable('customer');
        await migrateTable('service_providers');
        await migrateTable('consignees');
        await migrateTable('auditLog');

        // 2. Dependent on Customer
        await migrateTable('address');

        // 3. Dependent on User/Customer/Service/Consignee
        await migrateTable('shipments');

        // 4. Dependent on Shipments
        await migrateTable('shipmentEvent');
        await migrateTable('billing_invoices');
        await migrateTable('product_invoice_items');
        await migrateTable('shipment_boxes');

        // 5. Invoices (Customer)
        await migrateTable('invoice');

        // 6. Dependent on Invoice
        await migrateTable('payment');
        await migrateTable('invoiceLineItem');

        // 7. Ledger (Customer, Invoice, Payment)
        await migrateTable('ledgerEntry');

        // 8. Shipment Invoices (Shipments)
        await migrateTable('shipment_invoices');

        // 9. Shipment Invoice Items (Shipment Invoices)
        await migrateTable('shipment_invoice_line_items');

        console.log('Migration completed!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await localPrisma.$disconnect();
        await supabasePrisma.$disconnect();
    }
}

main();
