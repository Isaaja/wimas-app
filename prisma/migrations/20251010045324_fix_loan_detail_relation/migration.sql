-- AlterTable
ALTER TABLE "public"."LoanDetail" ADD COLUMN     "borrower_id" TEXT;

-- CreateIndex
CREATE INDEX "LoanDetail_borrower_id_idx" ON "public"."LoanDetail"("borrower_id");

-- AddForeignKey
ALTER TABLE "public"."LoanDetail" ADD CONSTRAINT "LoanDetail_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
