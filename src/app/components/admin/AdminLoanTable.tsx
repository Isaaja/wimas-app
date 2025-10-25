"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Eye,
  CheckCircle,
  XCircle,
  View,
  X,
  Filter,
  CheckCheck,
} from "lucide-react";
import { Loan } from "@/hooks/useLoans";
import Loading from "../common/Loading";
import { useState, useMemo } from "react";

interface AdminLoanTableProps {
  loans: Loan[];
  isLoading?: boolean;
  onApprove?: (loanId: string) => void;
  onReject?: (loanId: string) => void;
  onDone?: (loanId: string) => void;
  onViewDetail: (loanId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isDoing?: boolean;
  actioningLoanId?: string | null;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  mode?: "active" | "history";
}

export default function AdminLoanTable({
  loans,
  isLoading = false,
  onApprove,
  onReject,
  onDone,
  onViewDetail,
  isApproving = false,
  isRejecting = false,
  isDoing = false,
  actioningLoanId = null,
  currentPage,
  itemsPerPage,
  onPageChange,
  mode = "active",
}: AdminLoanTableProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy", { locale: id });
  };

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      REQUESTED: { label: "Menunggu", class: "badge-warning" },
      APPROVED: { label: "Disetujui", class: "badge-success" },
      REJECTED: { label: "Ditolak", class: "badge-error" },
      RETURNED: { label: "Dikembalikan", class: "badge-info" },
      DONE: { label: "Selesai", class: "badge-success" },
    };
    return statusMap[status] || { label: status, class: "badge-ghost" };
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

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLoans = filteredLoans.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    onPageChange(1);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    onPageChange(1);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setShowDatePicker(false);
    onPageChange(1);
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

  if (isLoading) {
    return <Loading />;
  }

  if (loans.length === 0) {
    return (
      <div className="alert alert-info">
        <span>Tidak ada data peminjaman.</span>
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

            {/* Quick Filters */}
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

          {/* Right Side - Clear Filter & Results Info */}
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

        {/* Compact Date Picker */}
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

      {/* Table Section */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        <table className="table w-full">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="w-12">No</th>
              <th className="w-32">Peminjam</th>
              <th className="w-48">No. SPT</th>
              <th className="w-48">Tanggal Peminjaman</th>
              <th className="w-32">Status</th>
              <th className="w-20 text-center">Dokumen</th>
              <th className="w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentLoans.map((loan, index) => {
              const statusInfo = getStatusBadge(loan.status);
              const isProcessing =
                (isApproving || isRejecting || isDoing) &&
                actioningLoanId === loan.loan_id;
              const sptFileUrl = getSptFileUrl(loan.report?.spt_file);

              return (
                <tr key={loan.loan_id} className="hover">
                  <td className="border-t border-black/10 font-medium py-2 text-sm ml-4">
                    {startIndex + index + 1}
                  </td>

                  <td className="border-t border-black/10 py-2 px-2">
                    <div className="font-semibold text-sm">
                      {loan.borrower.name || loan.borrower.username || "-"}
                    </div>
                  </td>

                  <td className="border-t border-black/10 py-2 px-2">
                    {loan.report ? (
                      <div className="text-gray-600 text-sm">
                        {loan.report.spt_number}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic text-xs">
                        Tidak ada data SPT
                      </span>
                    )}
                  </td>
                  <td className="border-t border-black/10">
                    <div className="space-y-2">
                      <div className="text-xs">
                        {formatDateOnly(loan.report?.start_date)} -{" "}
                        {formatDateOnly(loan.report?.end_date)}
                      </div>
                    </div>
                  </td>

                  <td className="border-t border-black/10 py-2 px-2">
                    <div className="flex flex-col gap-0.5">
                      <span className={`badge ${statusInfo.class} badge-sm`}>
                        {statusInfo.label}
                      </span>
                      <div className="text-xs text-gray-500">
                        {formatDate(loan.updated_at)}
                      </div>
                    </div>
                  </td>

                  <td className="border-t border-black/10 py-2 px-1">
                    {sptFileUrl ? (
                      <div className="flex flex-col gap-0.5 items-center">
                        <a
                          href={sptFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-xs text-blue-600 tooltip p-1 h-auto min-h-0"
                          data-tip="Lihat Dokumen SPT"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <span className="text-xs text-gray-500">SPT</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5 items-center">
                        <span
                          className="text-gray-400 tooltip p-1"
                          data-tip="Tidak Ada Dokumen SPT"
                        >
                          <Eye className="w-4 h-4" />
                        </span>
                        <span className="text-xs text-gray-400">-</span>
                      </div>
                    )}
                  </td>

                  <td className="border-t border-black/10 py-2 px-1">
                    <div className="flex justify-center items-center gap-1">
                      {mode === "active" && loan.status === "REQUESTED" && (
                        <>
                          <button
                            onClick={() => onViewDetail(loan.loan_id)}
                            disabled={isProcessing}
                            className="btn btn-success btn-xs tooltip"
                            data-tip="Review & Approve"
                          >
                            {isProcessing &&
                            actioningLoanId === loan.loan_id ? (
                              <span className="loading loading-spinner loading-xs text-info"></span>
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                          </button>

                          <button
                            onClick={() => onReject?.(loan.loan_id)}
                            disabled={isProcessing}
                            className="btn btn-error btn-xs tooltip"
                            data-tip="Tolak Peminjaman"
                          >
                            {isProcessing &&
                            actioningLoanId === loan.loan_id ? (
                              <span className="loading loading-spinner loading-xs text-info"></span>
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}

                      {/* Tombol DONE untuk status RETURNED */}
                      {loan.status === "RETURNED" && (
                        <button
                          onClick={() => onDone?.(loan.loan_id)}
                          disabled={isProcessing}
                          className="btn btn-info btn-xs tooltip"
                          data-tip="Selesaikan Peminjaman"
                        >
                          {isProcessing && actioningLoanId === loan.loan_id ? (
                            <span className="loading loading-spinner loading-xs text-info"></span>
                          ) : (
                            <CheckCheck className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      {/* Tombol Lihat Detail untuk semua status selain REQUESTED */}
                      {(mode === "history" ||
                        (mode === "active" &&
                          loan.status !== "REQUESTED" &&
                          loan.status !== "RETURNED")) && (
                        <button
                          onClick={() => onViewDetail(loan.loan_id)}
                          className="btn btn-ghost btn-xs text-blue-600 tooltip"
                          data-tip="Lihat Detail"
                        >
                          <View className="w-4 h-4" />
                        </button>
                      )}

                      {/* Tombol Lihat Detail untuk status RETURNED (selain tombol DONE) */}
                      {loan.status === "RETURNED" && (
                        <button
                          onClick={() => onViewDetail(loan.loan_id)}
                          className="btn btn-ghost btn-xs text-blue-600 tooltip"
                          data-tip="Lihat Detail"
                        >
                          <View className="w-4 h-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex text-sm text-gray-600">
            {currentPage} of {totalPages} pages
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
