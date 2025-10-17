"use client";

import { useState } from "react";
import Loading from "@/app/components/common/Loading";
import { useLoans, useApproveLoan, useRejectLoan } from "@/hooks/useLoans";
import AdminLoanTable from "@/app/components/admin/AdminLoanTable";

export default function AdminPeminjamanPage() {
  const { loans, isLoading, isError, error } = useLoans("history");
  const { mutate: approveLoan, isPending: isApproving } = useApproveLoan();
  const { mutate: rejectLoan, isPending: isRejecting } = useRejectLoan();
  const [actioningLoanId, setActioningLoanId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(2);

  const handleApprove = (loanId: string) => {
    if (confirm("Apakah Anda yakin ingin menyetujui peminjaman ini?")) {
      setActioningLoanId(loanId);
      approveLoan(loanId, {
        onSettled: () => setActioningLoanId(null),
      });
    }
  };

  const handleReject = (loanId: string) => {
    if (confirm("Apakah Anda yakin ingin menolak peminjaman ini?")) {
      setActioningLoanId(loanId);
      rejectLoan(loanId, {
        onSettled: () => setActioningLoanId(null),
      });
    }
  };

  const handleViewDetailLoan = (loanId: string) => {
    // TODO: Implement detail view (e.g., open modal or navigate to detail page)
    console.log("View detail for loan:", loanId);
  };

  if (isLoading) return <Loading />;

  if (isError)
    return (
      <div className="alert alert-error mt-4">
        <span>Error: {error?.message || "Gagal memuat data peminjaman."}</span>
      </div>
    );

  if (!loans || loans.length === 0)
    return (
      <div className="alert alert-info mt-4">
        <span>Tidak ada data peminjaman aktif.</span>
      </div>
    );

  return (
    <>
      <div className="p-6 min-h-screen">
        <h1 className="text-2xl font-bold ">Daftar Peminjaman Aktif</h1>

        <AdminLoanTable
          loans={loans || []}
          isLoading={isLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewDetail={handleViewDetailLoan}
          isApproving={isApproving}
          isRejecting={isRejecting}
          actioningLoanId={actioningLoanId}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
