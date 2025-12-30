
import { prisma } from '../db/client.js';

async function checkInvoices() {
    try {
        // 1. Get the most recent confirmed shipment
        const shipment = await prisma.shipments.findFirst({
            where: { status: 'Confirmed' },
            orderBy: { createdAt: 'desc' },
            include: {
                billing_invoices: true
            }
        });

        if (!shipment) {
            console.log('No confirmed shipments found.');
            return;
        }

        console.log('--- Latest Confirmed Shipment ---');
        console.log(`ID: ${shipment.id}`);
        console.log(`Ref: ${shipment.referenceNumber}`);
        console.log(`Customer ID: ${shipment.customerId}`);
        console.log(`Billing:`, shipment.billing_invoices);

        // 2. Get Invoices
        const invoices = await prisma.shipment_invoices.findMany({
            where: { shipmentId: shipment.id },
            include: {
                lineItems: true
            }
        });

        console.log(`\nFound ${invoices.length} Invoices:`);
        invoices.forEach(inv => {
            console.log(`\n[${inv.type}] ID: ${inv.id}`);
            console.log(`  Number: ${inv.invoiceNumber}`);
            console.log(`  PDF URL: ${inv.pdfUrl}`);
            console.log(`  Line Items (${inv.lineItems.length}):`);
            inv.lineItems.forEach(item => {
                console.log(`    - ${item.description}: ${item.total}`);
            });
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkInvoices();
