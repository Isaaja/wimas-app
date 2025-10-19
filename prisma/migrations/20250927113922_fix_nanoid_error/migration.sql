/*
  Warnings:

  - The primary key for the `Authentication` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Loan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LoanDetail` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LoanHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Report` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."Authentication" DROP CONSTRAINT "Authentication_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Loan" DROP CONSTRAINT "Loan_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoanDetail" DROP CONSTRAINT "LoanDetail_loan_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoanDetail" DROP CONSTRAINT "LoanDetail_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoanHistory" DROP CONSTRAINT "LoanHistory_loan_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Authentication" DROP CONSTRAINT "Authentication_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Authentication_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Authentication_id_seq";

-- AlterTable
ALTER TABLE "public"."Category" DROP CONSTRAINT "Category_pkey",
ALTER COLUMN "category_id" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id");

-- AlterTable
ALTER TABLE "public"."Loan" DROP CONSTRAINT "Loan_pkey",
ALTER COLUMN "loan_id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Loan_pkey" PRIMARY KEY ("loan_id");

-- AlterTable
ALTER TABLE "public"."LoanDetail" DROP CONSTRAINT "LoanDetail_pkey",
ALTER COLUMN "loan_detail_id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "loan_id" SET DATA TYPE TEXT,
ALTER COLUMN "product_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "LoanDetail_pkey" PRIMARY KEY ("loan_detail_id");

-- AlterTable
ALTER TABLE "public"."LoanHistory" DROP CONSTRAINT "LoanHistory_pkey",
ALTER COLUMN "history_id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "loan_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "LoanHistory_pkey" PRIMARY KEY ("history_id");

-- AlterTable
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_pkey",
ALTER COLUMN "product_id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "category_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id");

-- AlterTable
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_pkey",
ALTER COLUMN "report_id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Report_pkey" PRIMARY KEY ("report_id");

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanDetail" ADD CONSTRAINT "LoanDetail_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."Loan"("loan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanDetail" ADD CONSTRAINT "LoanDetail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanHistory" ADD CONSTRAINT "LoanHistory_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."Loan"("loan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Authentication" ADD CONSTRAINT "Authentication_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
