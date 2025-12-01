/*
  Warnings:

  - You are about to drop the column `quantity` on the `LoanItem` table. All the data in the column will be lost.
  - Added the required column `unit_id` to the `LoanItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'LOANED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('GOOD', 'DAMAGED');

-- DropIndex
DROP INDEX "public"."Loan_borrower_id_status_idx";

-- AlterTable
ALTER TABLE "LoanItem" DROP COLUMN "quantity",
ADD COLUMN     "unit_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProductUnit" (
    "unit_id" VARCHAR(32) NOT NULL,
    "product_id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "ItemCondition" NOT NULL DEFAULT 'GOOD',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("unit_id")
);

-- CreateTable
CREATE TABLE "LoanRequestItem" (
    "id" VARCHAR(32) NOT NULL,
    "loan_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "LoanRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductUnit_serialNumber_key" ON "ProductUnit"("serialNumber");

-- CreateIndex
CREATE INDEX "ProductUnit_product_id_idx" ON "ProductUnit"("product_id");

-- CreateIndex
CREATE INDEX "ProductUnit_status_idx" ON "ProductUnit"("status");

-- AddForeignKey
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanItem" ADD CONSTRAINT "LoanItem_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "ProductUnit"("unit_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRequestItem" ADD CONSTRAINT "LoanRequestItem_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "Loan"("loan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRequestItem" ADD CONSTRAINT "LoanRequestItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
