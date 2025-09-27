-- AlterTable
ALTER TABLE "public"."Category" ALTER COLUMN "category_id" DROP DEFAULT;
DROP SEQUENCE "Category_category_id_seq";

-- AlterTable
ALTER TABLE "public"."Loan" ALTER COLUMN "loan_id" DROP DEFAULT;
DROP SEQUENCE "Loan_loan_id_seq";

-- AlterTable
ALTER TABLE "public"."LoanDetail" ALTER COLUMN "loan_detail_id" DROP DEFAULT;
DROP SEQUENCE "LoanDetail_loan_detail_id_seq";

-- AlterTable
ALTER TABLE "public"."LoanHistory" ALTER COLUMN "history_id" DROP DEFAULT;
DROP SEQUENCE "LoanHistory_history_id_seq";

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "product_id" DROP DEFAULT;
DROP SEQUENCE "Product_product_id_seq";

-- AlterTable
ALTER TABLE "public"."Report" ALTER COLUMN "report_id" DROP DEFAULT;
DROP SEQUENCE "Report_report_id_seq";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "user_id" DROP DEFAULT;
DROP SEQUENCE "User_user_id_seq";
