
import { prisma } from '../db/client.js';

const targetId = '0b483939-6d84-4c2c-875e-f7ef6fcc9957';

async function findId() {
    console.log(`Searching for ID: ${targetId}...`);

    try {
        // 1. Check Shipment Invoices
        const shipmentInvoice = await prisma.shipment_invoices.findUnique({ where: { id: targetId } });
        if (shipmentInvoice) {
            console.log('>>> FOUND IN: shipment_invoices');
            console.log(shipmentInvoice);
            return;
        }

        // 2. Check Shipments
        const shipment = await prisma.shipments.findUnique({ where: { id: targetId } });
        if (shipment) {
            console.log('>>> FOUND IN: shipments');
            return;
        }

        // 3. Check Main Invoice (Ledger Invoice)
        const mainInvoice = await prisma.invoice.findUnique({ where: { id: targetId } });
        if (mainInvoice) {
            console.log('>>> FOUND IN: Invoice (Main Ledger Invoice)');
            return;
        }

        console.log('>>> ID NOT FOUND anywhere.');

    } catch (error) {
        console.error('Error during search:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findId();
