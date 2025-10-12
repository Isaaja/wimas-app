export function formatLoanResponse(loan: any) {
  // Pisahkan participant berdasarkan role
  const owner = loan.participants.find((p: any) => p.role === "OWNER");
  const invited_users = loan.participants
    .filter((p: any) => p.role === "INVITED")
    .map((p: any) => ({
      user_id: p.user.user_id,
      name: p.user.name,
      username: p.user.username,
    }));

  // Produk
  const products = loan.items.map((item: any) => ({
    product_id: item.product.product_id,
    product_name: item.product.product_name,
    quantity: item.quantity,
  }));

  return {
    loan_id: loan.loan_id,
    borrower_id: loan.borrower.user_id,
    borrower_name: loan.borrower.name,
    borrower_username: loan.borrower.username,
    status: loan.status,
    spt_file: loan.spt_file,
    created_at: loan.created_at,
    updated_at: loan.updated_at,
    owner: owner
      ? {
          user_id: owner.user.user_id,
          name: owner.user.name,
          username: owner.user.username,
        }
      : null,
    invited_users,
    products,
  };
}
