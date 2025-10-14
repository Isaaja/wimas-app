/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `loan_date` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `return_date` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `spt_letter` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `loan_detail_id` on the `LoanItem` table. All the data in the column will be lost.
  - You are about to drop the `LoanDetail` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `borrower_id` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Loan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `loan_id` to the `LoanItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Loan" DROP CONSTRAINT "Loan_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoanDetail" DROP CONSTRAINT "LoanDetail_borrower_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoanDetail" DROP CONSTRAINT "LoanDetail_loan_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoanItem" DROP CONSTRAINT "LoanItem_loan_detail_id_fkey";

-- DropIndex
DROP INDEX "public"."Loan_user_id_idx";

-- DropIndex
DROP INDEX "public"."LoanItem_loan_detail_id_idx";

-- DropIndex
DROP INDEX "public"."LoanItem_product_id_idx";

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "createdAt",
DROP COLUMN "loan_date",
DROP COLUMN "return_date",
DROP COLUMN "spt_letter",
DROP COLUMN "updatedAt",
DROP COLUMN "user_id",
ADD COLUMN     "borrower_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "spt_file" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LoanItem" DROP COLUMN "loan_detail_id",
ADD COLUMN     "loan_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."LoanDetail";

-- CreateTable
CREATE TABLE "LoanParticipant" (
    "id" VARCHAR(32) NOT NULL,
    "loan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_borrower" (
    "A" VARCHAR(32) NOT NULL,
    "B" VARCHAR(32) NOT NULL,

    CONSTRAINT "_borrower_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_borrower_B_index" ON "_borrower"("B");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanItem" ADD CONSTRAINT "LoanItem_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "Loan"("loan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanParticipant" ADD CONSTRAINT "LoanParticipant_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "Loan"("loan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanParticipant" ADD CONSTRAINT "LoanParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_borrower" ADD CONSTRAINT "_borrower_A_fkey" FOREIGN KEY ("A") REFERENCES "Loan"("loan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_borrower" ADD CONSTRAINT "_borrower_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
