/*
  Warnings:

  - You are about to drop the column `image_path` on the `LoanDetail` table. All the data in the column will be lost.
  - Added the required column `image_path` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "image_path" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LoanDetail" DROP COLUMN "image_path";
