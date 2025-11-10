import { Loan, LoanHistory } from '@/hooks/useLoans';

export const adaptLoanHistoryToLoan = (loanHistory: LoanHistory): Loan => {
  return {
    loan_id: loanHistory.loan_id,
    status: loanHistory.status,
    created_at: loanHistory.created_at,
    updated_at: loanHistory.updated_at,
    borrower: loanHistory.borrower,
    owner: loanHistory.borrower, 
    invited_users: loanHistory.participants
      ?.filter(p => p.role === "INVITED")
      .map(p => p.user) || [],
    items: loanHistory.items,
    report: loanHistory.report,
  };
};

export const adaptLoanHistoryArrayToLoan = (loanHistories: LoanHistory[]): Loan[] => {
  return loanHistories.map(adaptLoanHistoryToLoan);
};