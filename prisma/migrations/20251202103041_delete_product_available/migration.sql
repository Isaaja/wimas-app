/*
  Warnings:

  - You are about to drop the column `product_available` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Product_product_available_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "product_available";
