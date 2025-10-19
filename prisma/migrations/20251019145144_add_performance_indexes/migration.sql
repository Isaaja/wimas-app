-- CreateIndex
CREATE INDEX "Loan_borrower_id_idx" ON "Loan"("borrower_id");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_created_at_idx" ON "Loan"("created_at");

-- CreateIndex
CREATE INDEX "Loan_borrower_id_status_idx" ON "Loan"("borrower_id", "status");

-- CreateIndex
CREATE INDEX "Product_category_id_idx" ON "Product"("category_id");

-- CreateIndex
CREATE INDEX "Product_product_avaible_idx" ON "Product"("product_avaible");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
