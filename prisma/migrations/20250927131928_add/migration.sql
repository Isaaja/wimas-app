/*
  Warnings:

  - Added the required column `product_avaible` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "product_avaible" INTEGER NOT NULL;
