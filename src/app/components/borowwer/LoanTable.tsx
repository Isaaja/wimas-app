"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Eye,
  EyeOff,
  View,
  FileText,
  RefreshCcwDot,
  Link,
  Filter,
  X,
} from "lucide-react";
import LoanDetail from "./LoanDetail";
import ReturnModal from "./ReturnModal";
import Swal from "sweetalert2";
import {
  useReturnLoan,
  hasUnitAssignments,
  type Loan,
  type LoanHistory,
} from "@/hooks/useLoans";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface LoanTableProps {
  loans: (Loan | LoanHistory)[];
  isLoading?: boolean;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function LoanTable({
  loans,
  isLoading = false,
  currentPage,
  itemsPerPage,
  onPageChange,
}: LoanTableProps) {
  const [actioningLoanId, setActioningLoanId] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | LoanHistory | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loanToReturn, setLoanToReturn] = useState<Loan | LoanHistory | null>(
    null
  );
  const { mutate: returnLoan, isPending: isReturning } = useReturnLoan();
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filteredLoans = useMemo(() => {
    if (!startDate && !endDate) return loans;

    return loans.filter((loan) => {
      if (!loan.created_at) return false;

      const loanDate = new Date(loan.created_at);
      const loanTime = loanDate.getTime();

      if (startDate && endDate) {
        const startTime = new Date(startDate).getTime();
        const endTime = new Date(endDate + "T23:59:59").getTime();
        return loanTime >= startTime && loanTime <= endTime;
      } else if (startDate) {
        const startTime = new Date(startDate).getTime();
        return loanTime >= startTime;
      } else if (endDate) {
        const endTime = new Date(endDate + "T23:59:59").getTime();
        return loanTime <= endTime;
      }

      return true;
    });
  }, [loans, startDate, endDate]);

  const getDisplayDateRange = () => {
    if (startDate && endDate) {
      return `${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`;
    } else if (startDate) {
      return `Dari ${formatDateOnly(startDate)}`;
    } else if (endDate) {
      return `Sampai ${formatDateOnly(endDate)}`;
    }
    return "Semua Periode";
  };

  const quickFilters = [
    { label: "Hari Ini", days: 0 },
    { label: "7 Hari", days: 7 },
    { label: "30 Hari", days: 30 },
    { label: "Bulan Ini", days: -1 },
  ];

  const applyQuickFilter = (days: number) => {
    const today = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let start = new Date();

    if (days === -1) {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      start.setDate(today.getDate() - days);
      start.setHours(0, 0, 0, 0);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setShowDatePicker(false);
    onPageChange(1);
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy", { locale: id });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      REQUESTED: { label: "Menunggu", class: "badge-warning" },
      APPROVED: { label: "Disetujui", class: "badge-success" },
      REJECTED: { label: "Ditolak", class: "badge-error" },
      RETURNED: { label: "Dikembalikan", class: "badge-primary" },
      DONE: { label: "Selesai", class: "badge-info" },
    };
    return statusMap[status] || { label: status, class: "badge-ghost" };
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setShowDatePicker(false);
    onPageChange(1);
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    onPageChange(1);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    onPageChange(1);
  };

  const getSptFileUrl = (sptFile: string | null | undefined): string | null => {
    if (!sptFile) return null;
    if (sptFile.startsWith("http")) return sptFile;
    if (sptFile.startsWith("public/")) {
      return sptFile.replace("public/", "/");
    }
    if (sptFile.startsWith("/")) return sptFile;
    return `/${sptFile}`;
  };

  const getMainBorrower = (loan: Loan | LoanHistory) => {
    if (
      "borrower" in loan &&
      typeof loan.borrower === "object" &&
      "name" in loan.borrower
    ) {
      return (
        (loan as Loan).borrower?.name ||
        (loan as Loan).borrower?.username ||
        "Unknown"
      );
    }
    if ("borrower" in loan && typeof loan.borrower === "object") {
      return (
        (loan as LoanHistory).borrower?.name ||
        (loan as LoanHistory).borrower?.username ||
        "Unknown"
      );
    }
    return "Unknown";
  };

  const getTotalItems = (loan: Loan | LoanHistory) => {
    if (!loan.items) return 0;

    if (loan.status === "REQUESTED") {
      return loan.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    } else {
      return loan.items.length;
    }
  };

  const getInvitedUsersCount = (loan: Loan | LoanHistory) => {
    if ("invited_users" in loan) {
      return (loan as Loan).invited_users?.length || 0;
    }
    if ("participants" in loan) {
      return (
        (loan as LoanHistory).participants?.filter((p) => p.role === "INVITED")
          .length || 0
      );
    }
    return 0;
  };

  const getItemsCount = (loan: Loan | LoanHistory) => {
    return loan.items?.length || 0;
  };

  const getReportData = (loan: Loan | LoanHistory) => {
    return "report" in loan ? loan.report : undefined;
  };

  const handleReturn = (loan: Loan | LoanHistory) => {
    setLoanToReturn(loan);
  };

  const confirmReturn = async () => {
    if (!loanToReturn) return;

    const result = await Swal.fire({
      title: "Konfirmasi Pengembalian",
      text: "Apakah Anda yakin ingin mengembalikan barang?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Kembalikan!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      setActioningLoanId(loanToReturn.loan_id);
      returnLoan(loanToReturn.loan_id, {
        onSuccess: () => {
          toast.success("Barang berhasil dikembalikan!");
          setLoanToReturn(null);
          setActioningLoanId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Gagal mengembalikan barang");
          setActioningLoanId(null);
        },
      });
    }
  };

  const handleCloseReturnModal = () => {
    setLoanToReturn(null);
  };

  const handleViewNota = (loanId: string) => {
    router.push(`/peminjam/nota/${loanId}`);
  };

  const totalPages = Math.ceil(loans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLoans = loans.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetail = (loan: Loan | LoanHistory) => {
    setSelectedLoan(loan);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedLoan(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="alert alert-info">
        <span>Tidak ada data peminjaman aktif.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`btn btn-sm gap-2 ${
                startDate || endDate ? "btn-info" : "btn-outline"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">{getDisplayDateRange()}</span>
              {(startDate || endDate) && (
                <div className="badge badge-sm badge-info">
                  {filteredLoans.length}
                </div>
              )}
            </button>

            <div className="flex flex-wrap gap-1">
              {quickFilters.map((filter, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickFilter(filter.days)}
                  className="btn btn-xs btn-ghost"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {filteredLoans.length} data
            </div>
            {(startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="btn btn-xs btn-ghost text-error"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {showDatePicker && (
          <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-blue-50">
            <div className="flex gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  className="input input-bordered input-info scheme-light w-full bg-white"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  max={endDate || undefined}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  className="input input-bordered input-info scheme-light w-full bg-white"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-gray-500">
                {startDate && endDate && getDisplayDateRange()}
              </div>
              <button
                onClick={() => setShowDatePicker(false)}
                className="btn btn-xs btn-ghost"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="whitespace-nowrap">No</th>
                <th className="whitespace-nowrap">Peminjam</th>
                <th className="whitespace-nowrap">No. SPT</th>
                <th className="whitespace-nowrap">Tanggal Peminjaman</th>
                <th className="whitespace-nowrap">Total Barang</th>
                <th className="whitespace-nowrap">Status</th>
                <th className="whitespace-nowrap text-center">Dokumen</th>
                <th className="whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentLoans.map((loan, index) => {
                const statusInfo = getStatusBadge(loan.status || "UNKNOWN");
                const isProcessing = actioningLoanId === loan.loan_id;
                const report = getReportData(loan);
                const sptFileUrl = getSptFileUrl(report?.spt_file);
                const mainBorrower = getMainBorrower(loan);
                const totalItems = getTotalItems(loan);
                const itemsCount = getItemsCount(loan);
                const invitedUsersCount = getInvitedUsersCount(loan);
                const hasUnits = hasUnitAssignments(loan as Loan);

                return (
                  <tr key={loan.loan_id} className="hover">
                    <td className="border-t border-black/10 font-medium">
                      {startIndex + index + 1}
                    </td>

                    <td className="border-t border-black/10">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {mainBorrower}
                        </div>
                        {invitedUsersCount > 0 && (
                          <div className="text-xs text-gray-500">
                            +{invitedUsersCount} peserta
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="border-t border-black/10">
                      <div className="text-sm">{report?.spt_number || "-"}</div>
                    </td>

                    <td className="border-t border-black/10">
                      <div className="text-sm space-y-1">
                        <div>
                          {formatDateOnly(report?.start_date)} -{" "}
                          {formatDateOnly(report?.end_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateOnly(loan.created_at)}
                        </div>
                      </div>
                    </td>

                    <td className="border-t border-black/10">
                      <div className="text-sm font-medium">
                        {totalItems} barang
                      </div>
                      <div className="text-xs text-gray-500">
                        {itemsCount} jenis
                      </div>
                    </td>

                    <td className="border-t border-black/10">
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${statusInfo.class} badge-sm`}>
                          {statusInfo.label}
                        </span>
                        {hasUnits && (
                          <span className="badge badge-outline badge-sm text-xs">
                            Ada unit
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="border-t border-black/10 text-center">
                      {sptFileUrl ? (
                        <div className="flex flex-col gap-1 items-center">
                          <a
                            href={sptFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs text-blue-600 lg:tooltip"
                            data-tip="Lihat Dokumen SPT"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <span className="text-xs text-gray-500">SPT</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 items-center">
                          <span
                            className="text-gray-400 lg:tooltip"
                            data-tip="Tidak Ada Dokumen SPT"
                          >
                            <EyeOff className="w-4 h-4" />
                          </span>
                          <span className="text-xs text-gray-400">-</span>
                        </div>
                      )}
                    </td>

                    <td className="border-t border-black/10">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          className="btn btn-ghost btn-xs text-blue-500 lg:tooltip"
                          data-tip="Lihat Detail"
                          onClick={() => handleViewDetail(loan)}
                        >
                          <View className="w-4 h-4" />
                        </button>

                        {loan.status === "APPROVED" && (
                          <button
                            className="btn btn-ghost btn-xs text-orange-600 lg:tooltip"
                            data-tip="Kembalikan Barang"
                            onClick={() => handleReturn(loan)}
                            disabled={isProcessing || isReturning}
                          >
                            {isProcessing ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <RefreshCcwDot className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {(loan.status === "APPROVED" ||
                          loan.status === "RETURNED" ||
                          loan.status === "DONE") && (
                          <button
                            className="btn btn-ghost btn-xs text-green-600 lg:tooltip"
                            data-tip="Lihat Nota"
                            onClick={() => handleViewNota(loan.loan_id)}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, loans.length)} dari{" "}
            {loans.length} data
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <ReturnModal
        loan={loanToReturn as Loan}
        isOpen={!!loanToReturn}
        isReturning={isReturning}
        onClose={handleCloseReturnModal}
        onConfirm={confirmReturn}
      />

      <LoanDetail
        loan={selectedLoan as Loan}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onNota={handleViewNota}
      />
    </div>
  );
}
