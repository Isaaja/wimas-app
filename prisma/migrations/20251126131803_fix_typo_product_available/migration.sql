/*
  Warnings:

  - You are about to drop the column `product_avaible` on the `Product` table. All the data in the column will be lost.
  - Added the required column `product_available` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Product_product_avaible_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "product_avaible",
ADD COLUMN     "product_available" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Product_product_available_idx" ON "Product"("product_available");
