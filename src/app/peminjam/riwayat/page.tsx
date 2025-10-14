"use client";

import Loading from "@/app/components/Loading";
import { useFilteredLoanHistory } from "@/hooks/useLoans";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, EyeOff } from "lucide-react";

export default function RiwayatPeminjamanPage() {
  const { loans, isLoading, isError, error } = useFilteredLoanHistory("completed");

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
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
        <span>Tidak ada data peminjaman.</span>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Daftar Peminjaman
      </h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="table w-full">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th>No</th>
              <th>Nama Peminjam</th>
              <th>Tanggal Pinjam</th>
              <th>Status</th>
              <th>Daftar Barang</th>
              <th>Tim</th>
              <th>Dokumen SPT</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan, index) => {
              const statusInfo = getStatusBadge(loan.status);
              return (
                <tr key={loan.loan_id} className="hover">
                  <td className="border-t border-black/10">{index + 1}</td>
                  <td className="border-t border-black/10">
                    <div>
                      <div className="font-semibold">{loan.borrower.name}</div>
                      <div className="text-sm text-gray-500">
                        @{loan.borrower.username || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="border-t border-black/10">
                    {formatDate(loan.created_at)}
                  </td>
                  <td className="border-t border-black/10">
                    <span className={`badge ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="border-t border-black/10">
                    {loan.items && loan.items.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {loan.items.map((item) => (
                          <li key={item.product_id}>
                            {item.product_name || "-"}
                            <span className="ml-2 text-sm text-gray-600">
                              ({item.quantity} unit)
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500 italic">
                        Tidak ada barang tercatat
                      </span>
                    )}
                  </td>
                  <td className="border-t border-black/10">
                    {loan.participants && loan.participants.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {loan.participants.map((participant) => (
                          <li key={participant.user.user_id}>
                            {participant.user.name || "-"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500 italic">
                        Tidak ada anggota tim
                      </span>
                    )}
                  </td>
                  <td className="border-t border-black/10 text-center">
                    {loan.spt_file ? (
                      <a
                        href={loan.spt_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm tooltip"
                        data-tip="Lihat Dokumen"
                      >
                        <Eye />
                      </a>
                    ) : (
                      <span
                        className="text-gray-500 italic text-sm tooltip"
                        data-tip="Tidak Ada Dokumen"
                      >
                        <EyeOff />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
