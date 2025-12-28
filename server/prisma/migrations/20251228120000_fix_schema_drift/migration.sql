-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'ADD_TO_LEDGER';

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DEFAULT 'Rs';

-- AlterTable
ALTER TABLE "billing_invoices" ADD COLUMN "cashAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "shipment_invoices" ALTER COLUMN "currency" SET DEFAULT 'Rs';
