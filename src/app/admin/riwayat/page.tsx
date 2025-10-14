"use client";

import { useState } from "react";
import Loading from "@/app/components/Loading";
import { useLoans, useApproveLoan, useRejectLoan } from "@/hooks/useLoans";
import AdminLoanTable from "@/app/components/AdminLoanTable";

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Daftar Peminjaman Aktif
      </h1>

      <AdminLoanTable
        loans={loans || []}
        isLoading={isLoading}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={isApproving}
        isRejecting={isRejecting}
        actioningLoanId={actioningLoanId}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
