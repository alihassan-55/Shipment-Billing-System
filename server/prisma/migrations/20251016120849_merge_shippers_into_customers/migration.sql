/*
  Warnings:

  - You are about to drop the column `shipperId` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the `shippers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `shipments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."shipments" DROP CONSTRAINT "shipments_shipperId_fkey";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cnic" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Pakistan',
ADD COLUMN     "ntn" TEXT,
ADD COLUMN     "personName" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "shipperId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."shippers";

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
