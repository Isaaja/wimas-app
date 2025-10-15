"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, EyeOff } from "lucide-react";

interface Loan {
  loan_id: string;
  status: string;
  participants: Array<{
    id: string;
    role: string;
    user: {
      name: string;
    };
  }>;
  report?: {
    spt_number?: string | null;
    spt_file?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
}

interface LoanTableProps {
  loans: Loan[];
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="whitespace-nowrap">No</th>
                <th className="whitespace-nowrap">Peminjam & Tim</th>
                <th className="whitespace-nowrap">No. SPT</th>
                <th className="whitespace-nowrap">Tanggal Peminjaman</th>
                <th className="whitespace-nowrap">Detail Peminjaman</th>
                <th className="whitespace-nowrap">Status</th>
                <th className="whitespace-nowrap text-center">Dokumen</th>
              </tr>
            </thead>
            <tbody>
              {currentLoans.map((loan, index) => {
                const statusInfo = getStatusBadge(loan.status);
                const isProcessing = actioningLoanId === loan.loan_id;
                const sptFileUrl = getSptFileUrl(loan.report?.spt_file);

                return (
                  <tr key={loan.loan_id} className="hover">
                    <td className="border-t border-black/10 font-medium">
                      {startIndex + index + 1}
                    </td>

                    {/* Kolom Peminjam & Tim */}
                    <td className="border-t border-black/10">
                      {loan.participants && loan.participants.length > 0 && (
                        <div className="space-y-1">
                          {loan.participants
                            .filter(
                              (participant) => participant.role === "OWNER"
                            )
                            .map((participant) => (
                              <div
                                key={participant.id}
                                className="text-md font-bold"
                              >
                                <span className="">
                                  {participant.user.name || "n/a"}
                                </span>
                              </div>
                            ))}
                          <span className="text-xs">Anggota Tim:</span>
                          {loan.participants
                            .filter(
                              (participant) => participant.role === "INVITED"
                            )
                            .map((participant) => (
                              <ul key={participant.id} className="text-xs">
                                <li className="list-disc list-inside">
                                  {participant.user.name || "n/a"}
                                </li>
                              </ul>
                            ))}
                        </div>
                      )}
                    </td>

                    {/* Kolom Data SPT */}
                    <td className="border-t border-black/10">
                      <div className="space-y-2 text-sm">
                        <div className="text-xs">
                          {loan.report?.spt_number || "-"}
                        </div>
                      </div>
                    </td>

                    <td className="border-t border-black/10">
                      <div className="space-y-2">
                        <div className="text-xs">
                          {formatDateOnly(loan.report?.start_date)} -{" "}
                          {formatDateOnly(loan.report?.end_date)}
                        </div>
                      </div>
                    </td>

                    <td className="border-t border-black/10">
                      <div className="text-sm">
                        <div className="font-medium">Barang:</div>
                        {loan.items && loan.items.length > 0 ? (
                          <ul className="list-disc list-inside text-gray-600">
                            {loan.items.map((item) => (
                              <li key={item.product_id}>
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
                    </td>

                    {/* Kolom Status */}
                    <td className="border-t border-black/10">
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${statusInfo.class} badge-sm`}>
                          {statusInfo.label}
                        </span>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination dengan desain baru */}
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
