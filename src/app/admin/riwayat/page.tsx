"use client";

import { useState } from "react";
import Loading from "@/app/components/common/Loading";
import { useLoans, Loan } from "@/hooks/useLoans";
import AdminLoanTable from "@/app/components/admin/AdminLoanTable";
import LoanDetailModal from "@/app/components/admin/LoanDetailModal";

export default function AdminRiwayatPage() {
  const { loans, isLoading, isError, error } = useLoans("history");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetailLoan = (loanId: string) => {
    const loan = loans?.find((l) => l.loan_id === loanId);
    if (loan) {
      setSelectedLoan(loan);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoan(null);
  };

  if (isLoading) return <Loading />;

  if (isError)
    return (
      <div className="alert alert-error mt-4">
        <span>Error: {error?.message || "Gagal memuat data riwayat."}</span>
      </div>
    );

  if (!loans || loans.length === 0)
    return (
      <div className="alert alert-info mt-4">
        <span>Tidak ada data riwayat peminjaman.</span>
      </div>
    );

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">
        Riwayat Peminjaman
      </h1>

      <AdminLoanTable
        loans={loans}
        isLoading={isLoading}
        onViewDetail={handleViewDetailLoan}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        mode="history"
      />

      <LoanDetailModal
        loan={selectedLoan}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
