"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Eye,
  CheckCircle,
  XCircle,
  View,
  X,
  CheckCheck,
  EyeOff,
} from "lucide-react";
import { Loan, hasUnitAssignments, getUniqueProducts } from "@/hooks/useLoans";
import Loading from "../common/Loading";
import { useState, useMemo } from "react";
import DateFilter from "../common/DateFilter";

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

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy", { locale: id });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
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
      DONE: { label: "Selesai", class: "badge-primary" },
    };
    return statusMap[status] || { label: status, class: "badge-ghost" };
  };

  const getSptFileUrl = (sptFile: string | null | undefined): string | null => {
    if (!sptFile) return null;

    // Jika sudah full URL
    if (sptFile.startsWith("http")) return sptFile;

    // Jika path relatif namun sudah di dalam "uploads/"
    if (sptFile.startsWith("uploads/")) {
      return `/uploads/spt/${sptFile.replace("uploads/", "")}`;
    }

    // Jika berasal dari public/
    if (sptFile.startsWith("public/")) {
      const cleaned = sptFile.replace("public/", "").replace("uploads/", "");
      return `/uploads/spt/${cleaned}`;
    }

    // Jika dimulai dari /
    if (sptFile.startsWith("/")) {
      const cleaned = sptFile.replace("/", "").replace("uploads/", "");
      return `/uploads/spt/${cleaned}`;
    }

    // Default (nama file biasa)
    return `/uploads/spt/${sptFile}`;
  };

  const getMainBorrower = (loan: Loan) => {
    return loan.borrower?.name || loan.borrower?.username || "Unknown";
  };

  const getTotalItems = (loan: Loan) => {
    if (!loan.items) return 0;

    if (loan.status === "REQUESTED") {
      return loan.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    } else {
      return loan.items.length;
    }
  };

  const getProductTypesCount = (loan: Loan) => {
    if (!loan.items) return 0;

    if (loan.status === "REQUESTED") {
      const uniqueProducts = new Set(loan.items.map((item) => item.product_id));
      return uniqueProducts.size;
    } else {
      const uniqueProducts = getUniqueProducts(loan);
      return uniqueProducts.length;
    }
  };

  const getInvitedUsersCount = (loan: Loan) => {
    return loan.invited_users?.length || 0;
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
      <DateFilter
        startDate={startDate}
        endDate={endDate}
        filteredCount={filteredLoans.length}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onClearFilters={clearFilters}
        formatDateOnly={formatDateOnly}
      />

      {filteredLoans.length === 0 ? (
        <div className="alert alert-warning">
          <span>Tidak ada data peminjaman pada periode yang dipilih.</span>
        </div>
      ) : (
        <>
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
                    const statusInfo = getStatusBadge(loan.status);
                    const isProcessing =
                      (isApproving || isRejecting || isDoing) &&
                      actioningLoanId === loan.loan_id;
                    const sptFileUrl = getSptFileUrl(loan.report?.spt_file);
                    const mainBorrower = getMainBorrower(loan);
                    const totalItems = getTotalItems(loan);
                    const productTypesCount = getProductTypesCount(loan);
                    const invitedUsersCount = getInvitedUsersCount(loan);
                    const hasUnits = hasUnitAssignments(loan);

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
                          <div className="text-sm">
                            {loan.report?.spt_number || "-"}
                          </div>
                        </td>

                        <td className="border-t border-black/10">
                          <div className="text-sm space-y-1">
                            <div>
                              {formatDateOnly(loan.report?.start_date)} -{" "}
                              {formatDateOnly(loan.report?.end_date)}
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
                            {productTypesCount} jenis
                          </div>
                        </td>

                        <td className="border-t border-black/10">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`badge ${statusInfo.class} badge-sm`}
                            >
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
                            {mode === "active" &&
                              loan.status === "REQUESTED" && (
                                <>
                                  <button
                                    onClick={() => onViewDetail(loan.loan_id)}
                                    disabled={isProcessing}
                                    className="btn btn-ghost btn-xs text-green-600 lg:tooltip"
                                    data-tip="Review & Approve"
                                  >
                                    {isProcessing &&
                                    actioningLoanId === loan.loan_id ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() => onReject?.(loan.loan_id)}
                                    disabled={isProcessing}
                                    className="btn btn-ghost btn-xs text-red-600 lg:tooltip lg:tooltip-left"
                                    data-tip="Tolak Peminjaman"
                                  >
                                    {isProcessing &&
                                    actioningLoanId === loan.loan_id ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                </>
                              )}

                            {loan.status === "RETURNED" && (
                              <button
                                onClick={() => onDone?.(loan.loan_id)}
                                disabled={isProcessing}
                                className="btn btn-ghost btn-xs text-blue-600 lg:tooltip"
                                data-tip="Selesaikan Peminjaman"
                              >
                                {isProcessing &&
                                actioningLoanId === loan.loan_id ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  <CheckCheck className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {loan.status !== "REQUESTED" && (
                              <button
                                className="btn btn-ghost btn-xs text-blue-500 lg:tooltip"
                                data-tip="Lihat Detail"
                                onClick={() => onViewDetail(loan.loan_id)}
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, filteredLoans.length)} dari{" "}
                {filteredLoans.length} data
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </button>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm">
                    Hal {currentPage} dari {totalPages}
                  </span>
                </div>
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
        </>
      )}
    </div>
  );
}
