-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_customerId_fkey";

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "balanceAfter" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "customerId" DROP NOT NULL,
ALTER COLUMN "paymentType" DROP NOT NULL,
ALTER COLUMN "paymentType" SET DEFAULT 'CASH';

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
