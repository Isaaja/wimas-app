"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, EyeOff, FileText, Calendar, MapPin } from "lucide-react";
import { Loan } from "@/hooks/useLoans";

interface AdminLoanTableProps {
  loans: Loan[];
  isLoading?: boolean;
  onApprove: (loanId: string) => void;
  onReject: (loanId: string) => void;
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
    if (sptFile.startsWith("/")) return sptFile;
    return `/uploads/${sptFile}`;
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
      {/* Tabel */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="table w-full">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th>No</th>
              <th>Peminjam & Tim</th>
              <th>Detail Peminjaman</th>
              <th>Data SPT</th>
              <th>Status</th>
              <th>Dokumen</th>
              <th>Aksi</th>
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
                  <td className="border-t border-black/10 font-medium">
                    {startIndex + index + 1}
                  </td>

                  {/* Kolom Peminjam & Tim */}
                  <td className="border-t border-black/10">
                    <div className="space-y-2">
                      {/* Peminjam Utama */}
                      <div>
                        <div className="font-semibold text-sm">
                          {loan.borrower.name || loan.borrower.username || "-"}
                        </div>
                      </div>

                      {/* Anggota Tim */}
                      {loan.invited_users && loan.invited_users.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Anggota Tim:
                          </div>
                          <div className="space-y-1">
                            {loan.invited_users.map((user) => (
                              <div key={user.user_id} className="text-xs">
                                <span className="font-medium">
                                  {user.name || user.username}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="border-t border-black/10">
                    <div className="space-y-2">
                      {/* Tanggal */}
                      <div className="text-sm">
                        <div className="font-medium">Dibuat:</div>
                        <div className="text-gray-600">
                          {formatDate(loan.created_at)}
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="font-medium">Barang:</div>
                        {loan.items && loan.items.length > 0 ? (
                          <ul className="list-disc list-inside text-gray-600">
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
                  <td className="border-t border-black/10">
                    {loan.report ? (
                      <div className="space-y-2 text-sm">
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
                      <span className="text-gray-500 italic text-sm">
                        Tidak ada data SPT
                      </span>
                    )}
                  </td>

                  {/* Kolom Status */}
                  <td className="border-t border-black/10">
                    <div className="flex flex-col gap-1">
                      <span className={`badge ${statusInfo.class} badge-sm`}>
                        {statusInfo.label}
                      </span>
                      <div className="text-xs text-gray-500">
                        {formatDate(loan.updated_at)}
                      </div>
                    </div>
                  </td>

                  {/* Kolom Dokumen SPT */}
                  <td className="border-t border-black/10 text-center">
                    {sptFileUrl ? (
                      <div className="flex flex-col gap-1 items-center">
                        <a
                          href={sptFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-xs text-blue-600 tooltip"
                          data-tip="Lihat Dokumen SPT"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <span className="text-xs text-gray-500">SPT</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 items-center">
                        <span
                          className="text-gray-400 tooltip"
                          data-tip="Tidak Ada Dokumen SPT"
                        >
                          <EyeOff className="w-4 h-4" />
                        </span>
                        <span className="text-xs text-gray-400">-</span>
                      </div>
                    )}
                  </td>

                  {/* Kolom Aksi */}
                  <td className="border-t border-black/10">
                    {loan.status === "REQUESTED" ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => onApprove(loan.loan_id)}
                          disabled={isProcessing}
                          className="btn btn-success btn-sm"
                        >
                          {isProcessing && actioningLoanId === loan.loan_id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            "Setujui"
                          )}
                        </button>
                        <button
                          onClick={() => onReject(loan.loan_id)}
                          disabled={isProcessing}
                          className="btn btn-error btn-sm"
                        >
                          {isProcessing && actioningLoanId === loan.loan_id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            "Tolak"
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-gray-500 text-sm italic">
                          {loan.status === "APPROVED"
                            ? "Sudah disetujui"
                            : loan.status === "REJECTED"
                            ? "Sudah ditolak"
                            : "Selesai"}
                        </span>
                      </div>
                    )}
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
