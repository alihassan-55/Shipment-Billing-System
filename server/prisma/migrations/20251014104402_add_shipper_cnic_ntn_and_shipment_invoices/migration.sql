-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('DECLARED_VALUE', 'BILLING');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('Draft', 'Confirmed', 'Paid', 'Posted');

-- AlterTable
ALTER TABLE "shippers" ADD COLUMN     "cnic" TEXT,
ADD COLUMN     "ntn" TEXT;

-- CreateTable
CREATE TABLE "shipment_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "customerAccountId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'Draft',
    "postedLedgerEntryId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_invoice_line_items" (
    "id" TEXT NOT NULL,
    "shipmentInvoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER,
    "unitPrice" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipment_invoices_invoiceNumber_key" ON "shipment_invoices"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "shipment_invoices" ADD CONSTRAINT "shipment_invoices_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_invoice_line_items" ADD CONSTRAINT "shipment_invoice_line_items_shipmentInvoiceId_fkey" FOREIGN KEY ("shipmentInvoiceId") REFERENCES "shipment_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
