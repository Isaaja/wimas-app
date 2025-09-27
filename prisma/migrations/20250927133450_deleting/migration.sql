/*
  Warnings:

  - You are about to drop the column `product_code` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Product_product_code_key";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "product_code";
