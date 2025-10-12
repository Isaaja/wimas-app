/*
  Warnings:

  - You are about to drop the column `image_path` on the `Loan` table. All the data in the column will be lost.
  - Added the required column `spt_letter` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "image_path",
ADD COLUMN     "spt_letter" TEXT NOT NULL;
