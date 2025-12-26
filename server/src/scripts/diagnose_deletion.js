
import { prisma } from '../db/client.js';

async function diagnose() {
    try {
        // 1. Get the most recent shipment
        const shipment = await prisma.shipments.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!shipment) {
            console.log('No shipments found.');
            return;
        }

        console.log('--- Diagnosis for Shipment ---');
        console.log(`ID: ${shipment.id}`);
        console.log(`Reference: "${shipment.referenceNumber}"`);
        console.log(`Created At: ${shipment.createdAt}`);

        // 2. Check for Shipment Invoices (Direct Relation)
        const shipmentInvoices = await prisma.shipment_invoices.findMany({
            where: { shipmentId: shipment.id }
        });
        console.log(`\nFound ${shipmentInvoices.length} Direct Shipment Invoices.`);

        // 3. Check for "Ghost" General Invoices (Linked via Description string)
        // Replicating the logic from the controller
        const descriptionQuery = shipment.referenceNumber;
        console.log(`\nSearching for General Invoices with description containing: "${descriptionQuery}" (Insensitive)`);

        const relatedGeneralInvoices = await prisma.invoice.findMany({
            where: {
                lineItems: {
                    some: {
                        description: {
                            contains: descriptionQuery,
                            mode: 'insensitive'
                        }
                    }
                }
            },
            include: {
                lineItems: true
            }
        });

        console.log(`Found ${relatedGeneralInvoices.length} Related General Invoices.`);
        relatedGeneralInvoices.forEach(inv => {
            console.log(` - ID: ${inv.id}`);
            console.log(`   Number: ${inv.invoiceNumber}`);
            console.log(`   Line Items:`);
            inv.lineItems.forEach(item => {
                console.log(`     - "${item.description}"`);
            });
        });

    } catch (error) {
        console.error('Diagnosis Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
