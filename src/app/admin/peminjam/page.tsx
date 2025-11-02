"use client";

import { useState, useEffect } from "react";
import Loading from "@/app/components/common/Loading";
import {
  useLoans,
  useApproveLoan,
  useRejectLoan,
  Loan,
  useDoneLoan,
} from "@/hooks/useLoans";
import AdminLoanTable from "@/app/components/admin/AdminLoanTable";
import LoanDetailModal from "@/app/components/admin/LoanDetailModal";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function AdminPeminjamanPage() {
  const { loans, isLoading, isError, error, refetch } = useLoans("active");
  const { mutate: approveLoan, isPending: isApproving } = useApproveLoan();
  const { mutate: rejectLoan, isPending: isRejecting } = useRejectLoan();
  const { mutate: doneLoan, isPending: isDoing } = useDoneLoan();

  const [actioningLoanId, setActioningLoanId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (loans && selectedLoan) {
      const updatedLoan = loans.find((l) => l.loan_id === selectedLoan.loan_id);
      console.log("🔍 Selected loan in parent:", updatedLoan?.items);
    }
  }, [loans, selectedLoan]);

  const handleDataUpdated = () => {
    refetch();
  };

  const handleApprove = async (loanId: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi Persetujuan",
      text: "Apakah Anda yakin ingin menyetujui peminjaman ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Setujui!",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setActioningLoanId(loanId);
      approveLoan(loanId, {
        onSettled: () => setActioningLoanId(null),
      });
      setIsModalOpen(false);
    }
  };

  const handleReject = async (loanId: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi Penolakan",
      text: "Apakah Anda yakin ingin menolak peminjaman ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Tolak!",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setActioningLoanId(loanId);
      rejectLoan(loanId, {
        onSettled: () => setActioningLoanId(null),
      });
    }
  };

  const handleDone = async (loanId: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi Penyelesaian",
      text: "Apakah Anda yakin ingin menyelesaikan peminjaman ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Selesaikan!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      setActioningLoanId(loanId);
      doneLoan(loanId, {
        onSettled: () => setActioningLoanId(null),
      });
    }
  };

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

  const handleViewNota = (loanId: string) => {
    router.push(`/admin/nota/${loanId}`);
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
    <div className="p-4 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">
        Daftar Peminjaman Aktif
      </h1>

      <AdminLoanTable
        loans={loans}
        onDone={handleDone}
        isDoing={isDoing}
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
        mode="active"
      />

      <LoanDetailModal
        loan={selectedLoan}
        isOpen={isModalOpen}
        onNota={handleViewNota}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
        onDataUpdated={handleDataUpdated}
        isApproving={isApproving && actioningLoanId === selectedLoan?.loan_id}
        isRejecting={isRejecting && actioningLoanId === selectedLoan?.loan_id}
      />
    </div>
  );
}
