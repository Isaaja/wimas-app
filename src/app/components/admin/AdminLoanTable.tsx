"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, EyeOff, FileText, Calendar, MapPin, View } from "lucide-react";
import { Loan } from "@/hooks/useLoans";

interface AdminLoanTableProps {
  loans: Loan[];
  isLoading?: boolean;
  onApprove: (loanId: string) => void;
  onReject: (loanId: string) => void;
  onViewDetail: (loanId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  actioningLoanId?: string | null;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function AdminLoanTable({
  loans,
  isLoading = false,
  onApprove,
  onReject,
  onViewDetail,
  isApproving = false,
  isRejecting = false,
  actioningLoanId = null,
  currentPage,
  itemsPerPage,
  onPageChange,
}: AdminLoanTableProps) {
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      REQUESTED: { label: "Menunggu", class: "badge-warning" },
      APPROVED: { label: "Disetujui", class: "badge-success" },
      REJECTED: { label: "Ditolak", class: "badge-error" },
      RETURNED: { label: "Dikembalikan", class: "badge-info" },
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

  // Calculate pagination
  const totalPages = Math.ceil(loans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLoans = loans.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="alert alert-info">
        <span>Tidak ada data peminjaman aktif.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="table w-full">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="w-12">No</th>
              <th className="w-32">Peminjam</th>
              <th className="w-48">Detail Peminjaman</th>
              <th className="w-48">Data SPT</th>
              <th className="w-32">Status</th>
              <th className="w-20 text-center">Dokumen</th>
              <th className="w-48 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentLoans.map((loan, index) => {
              const statusInfo = getStatusBadge(loan.status);
              const isProcessing =
                (isApproving || isRejecting) &&
                actioningLoanId === loan.loan_id;
              const sptFileUrl = getSptFileUrl(loan.report?.spt_file);

              return (
                <tr key={loan.loan_id} className="hover">
                  <td className="border-t border-black/10 font-medium py-2  text-sm ml-4">
                    {startIndex + index + 1}
                  </td>

                  {/* Kolom Peminjam */}
                  <td className="border-t border-black/10 py-2 px-2">
                    <div className="font-semibold text-sm">
                      {loan.borrower.name || loan.borrower.username || "-"}
                    </div>
                  </td>

                  <td className="border-t border-black/10 py-2 px-2">
                    <div className="space-y-1">
                      {/* Tanggal */}
                      <div className="text-xs">
                        <div className="font-medium">Dibuat:</div>
                        <div className="text-gray-600 text-xs">
                          {formatDate(loan.created_at)}
                        </div>
                      </div>

                      <div className="text-xs">
                        <div className="font-medium">Barang:</div>
                        {loan.items && loan.items.length > 0 ? (
                          <ul className="list-disc list-inside text-gray-600 text-xs">
                            {loan.items.map((item) => (
                              <li key={item.product_id || item.loan_item_id}>
                                {item.product_name}
                                <span className="ml-1 text-xs text-gray-500">
                                  ({item.quantity}x)
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-500 italic text-xs">
                            Tidak ada barang
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Kolom Data SPT */}
                  <td className="border-t border-black/10 py-2 px-2">
                    {loan.report ? (
                      <div className="space-y-1 text-xs">
                        {/* Nomor SPT */}
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            No. SPT:
                          </div>
                          <div className="text-gray-600 text-xs">
                            {loan.report.spt_number}
                          </div>
                        </div>

                        {/* Tujuan */}
                        {loan.report.destination && (
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Tujuan:
                            </div>
                            <div className="text-gray-600 text-xs">
                              {loan.report.destination}
                            </div>
                          </div>
                        )}

                        {/* Tempat Pelaksanaan */}
                        {loan.report.place_of_execution && (
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Tempat:
                            </div>
                            <div className="text-gray-600 text-xs">
                              {loan.report.place_of_execution}
                            </div>
                          </div>
                        )}

                        {/* Periode */}
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Periode:
                          </div>
                          <div className="text-gray-600 text-xs">
                            {formatDateOnly(loan.report.start_date)} -{" "}
                            {formatDateOnly(loan.report.end_date)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic text-xs">
                        Tidak ada data SPT
                      </span>
                    )}
                  </td>

                  {/* Kolom Status */}
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

                  {/* Kolom Dokumen SPT */}
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
                          <EyeOff className="w-4 h-4" />
                        </span>
                        <span className="text-xs text-gray-400">-</span>
                      </div>
                    )}
                  </td>

                  {/* Kolom Aksi */}
                  <td className="border-t border-black/10 py-2 px-1 ">
                    <div className="flex flex-row gap-1 justify-center items-center">
                      {/* Button Detail */}
                      <div className="flex flex-col gap-0.5 items-center">
                        <button
                          onClick={() => onViewDetail(loan.loan_id)}
                          className="btn btn-ghost btn-xs text-blue-600 tooltip p-1 h-auto min-h-0"
                          data-tip="Lihat Detail Peminjaman"
                        >
                          <View className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-500">Detail</span>
                      </div>

                      {/* Button Approve/Reject */}
                      {loan.status === "REQUESTED" && (
                        <>
                          <div className="flex flex-col gap-0.5 items-center">
                            <button
                              onClick={() => onApprove(loan.loan_id)}
                              disabled={isProcessing}
                              className="btn btn-ghost btn-xs text-green-600 tooltip p-1 h-auto min-h-0"
                              data-tip="Setujui Peminjaman"
                            >
                              {isProcessing &&
                              actioningLoanId === loan.loan_id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                            <span className="text-xs text-gray-500">
                              Setujui
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5 items-center">
                            <button
                              onClick={() => onReject(loan.loan_id)}
                              disabled={isProcessing}
                              className="btn btn-ghost btn-xs text-red-600 tooltip p-1 h-auto min-h-0"
                              data-tip="Tolak Peminjaman"
                            >
                              {isProcessing &&
                              actioningLoanId === loan.loan_id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                            </button>
                            <span className="text-xs text-gray-500">Tolak</span>
                          </div>
                        </>
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
