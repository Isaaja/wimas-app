/*
  Warnings:

  - The `status` column on the `Loan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_borrower` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[loan_id,user_id]` on the table `LoanParticipant` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `role` on the `LoanParticipant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('OWNER', 'INVITED');

-- DropForeignKey
ALTER TABLE "public"."Loan" DROP CONSTRAINT "Loan_borrower_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."_borrower" DROP CONSTRAINT "_borrower_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_borrower" DROP CONSTRAINT "_borrower_B_fkey";

-- DropIndex
DROP INDEX "public"."Authentication_user_id_idx";

-- DropIndex
DROP INDEX "public"."LoanHistory_loan_id_idx";

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "status",
ADD COLUMN     "status" "LoanStatus" NOT NULL DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE "LoanParticipant" DROP COLUMN "role",
ADD COLUMN     "role" "ParticipantRole" NOT NULL;

-- DropTable
DROP TABLE "public"."_borrower";

-- CreateIndex
CREATE UNIQUE INDEX "LoanParticipant_loan_id_user_id_key" ON "LoanParticipant"("loan_id", "user_id");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
