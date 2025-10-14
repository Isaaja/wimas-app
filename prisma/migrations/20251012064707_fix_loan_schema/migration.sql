/*
  Warnings:

  - You are about to drop the column `product_id` on the `LoanDetail` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `LoanDetail` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LoanDetail" DROP CONSTRAINT "LoanDetail_product_id_fkey";

-- DropIndex
DROP INDEX "public"."LoanDetail_product_id_idx";

-- AlterTable
ALTER TABLE "public"."LoanDetail" DROP COLUMN "product_id",
DROP COLUMN "quantity";

-- CreateTable
CREATE TABLE "public"."LoanItem" (
    "loan_item_id" VARCHAR(32) NOT NULL,
    "loan_detail_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "LoanItem_pkey" PRIMARY KEY ("loan_item_id")
);

-- CreateIndex
CREATE INDEX "LoanItem_loan_detail_id_idx" ON "public"."LoanItem"("loan_detail_id");

-- CreateIndex
CREATE INDEX "LoanItem_product_id_idx" ON "public"."LoanItem"("product_id");

-- CreateIndex
CREATE INDEX "Authentication_user_id_idx" ON "public"."Authentication"("user_id");

-- CreateIndex
CREATE INDEX "Loan_user_id_idx" ON "public"."Loan"("user_id");

-- AddForeignKey
ALTER TABLE "public"."LoanItem" ADD CONSTRAINT "LoanItem_loan_detail_id_fkey" FOREIGN KEY ("loan_detail_id") REFERENCES "public"."LoanDetail"("loan_detail_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanItem" ADD CONSTRAINT "LoanItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;
