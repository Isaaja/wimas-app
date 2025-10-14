-- CreateTable
CREATE TABLE "Report" (
    "report_id" VARCHAR(32) NOT NULL,
    "loan_id" TEXT NOT NULL,
    "spt_file" TEXT,
    "spt_number" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "place_of_execution" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_loan_id_key" ON "Report"("loan_id");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "Loan"("loan_id") ON DELETE CASCADE ON UPDATE CASCADE;
