/*
  Warnings:

  - Added the required column `image_path` to the `LoanDetail` table without a default value. This is not possible if the table is not empty.
  - Made the column `borrower_id` on table `LoanDetail` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."LoanDetail" ADD COLUMN     "image_path" TEXT NOT NULL,
ALTER COLUMN "borrower_id" SET NOT NULL;
