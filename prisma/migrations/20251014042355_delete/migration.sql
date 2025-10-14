/*
  Warnings:

  - You are about to drop the `LoanHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LoanHistory" DROP CONSTRAINT "LoanHistory_loan_id_fkey";

-- DropTable
DROP TABLE "public"."LoanHistory";
