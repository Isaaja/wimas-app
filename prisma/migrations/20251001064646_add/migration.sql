/*
  Warnings:

  - A unique constraint covering the columns `[product_name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_product_name_key" ON "public"."Product"("product_name");
