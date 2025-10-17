/*
  Warnings:

  - The values [Draft,Confirmed,Paid,Posted] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the `ledger_entries` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentType` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'BANK_TRANSFER', 'ONLINE', 'CREDIT', 'CHEQUE');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('INVOICE', 'PAYMENT', 'ADJUSTMENT', 'REFUND');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'UNPAID', 'PARTIAL', 'PAID');
ALTER TABLE "public"."shipment_invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TABLE "shipment_invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "shipment_invoices" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "ledgerBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'PKR',
DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "method",
DROP COLUMN "paymentDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "shipment_invoices" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "public"."ledger_entries";

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "referenceId" TEXT,
    "entryType" "LedgerEntryType" NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
