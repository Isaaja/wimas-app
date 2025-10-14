export function formatLoanResponse(loan: any) {
  if (!loan) return null;

  // ✅ Pisahkan participant berdasarkan role
  const owner = loan.participants?.find((p: any) => p.role === "OWNER");
  const invited_users = loan.participants
    ?.filter((p: any) => p.role === "INVITED")
    ?.map((p: any) => ({
      user_id: p.user.user_id,
      username: p.user.username,
      name: p.user.name,
    }));

  // ✅ Format items
  const items = loan.items?.map((item: any) => ({
    loan_item_id: item.loan_item_id,
    product_id: item.product.product_id,
    product_name: item.product.product_name,
    quantity: item.quantity,
  }));

  // ✅ Format report
  const report = loan.report
    ? {
        report_id: loan.report.report_id,
        spt_file: loan.report.spt_file,
        spt_number: loan.report.spt_number,
        destination: loan.report.destination,
        place_of_execution: loan.report.place_of_execution,
        start_date: loan.report.start_date,
        end_date: loan.report.end_date,
      }
    : null;

  // ✅ Return format yang bersih
  return {
    loan_id: loan.loan_id,
    status: loan.status,
    created_at: loan.created_at,
    updated_at: loan.updated_at,

    // borrower utama
    borrower: {
      user_id: loan.borrower?.user_id,
      username: loan.borrower?.username,
      name: loan.borrower?.name,
    },

    owner: owner
      ? {
          user_id: owner.user.user_id,
          username: owner.user.username,
        }
      : null,

    invited_users: invited_users || [],
    items: items || [],
    report,
  };
}
