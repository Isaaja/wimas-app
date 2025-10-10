"use client";

import Loading from "@/app/components/Loading";
import { useLoans } from "@/hooks/useLoans";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminPeminjamanPage() {
  const { loans, isLoading, isError, error } = useLoans();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
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
              <th>Tanggal Dikembalikan</th>
              <th>Status</th>
              <th>Daftar Barang</th>
              <th>Tim</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan, index) => (
              <tr key={loan.loan_id} className="hover">
                <td className="border-t border-black/10">{index + 1}</td>
                <td className="border-t border-black/10">{loan.name}</td>
                <td className="border-t border-black/10">
                  {formatDate(loan.loan_date)}
                </td>
                <td className="border-t border-black/10">
                  {formatDate(loan.return_date)}
                </td>
                <td className="border-t border-black/10">
                  <span
                    className={`badge ${
                      loan.status === "REQUESTED"
                        ? "badge-warning"
                        : loan.status === "APPROVED"
                        ? "badge-success"
                        : "badge-error"
                    }`}
                  >
                    {loan.status}
                  </span>
                </td>
                <td className="border-t border-black/10">
                  {loan.products && loan.products.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {loan.products.map((p, i) => (
                        <li key={i}>
                          {p.product_name}{" "}
                          <span className="ml-2 text-sm text-gray-600">
                            ({p.quantity} unit)
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
                  {loan.invited_users && loan.invited_users.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {loan.invited_users.map((p, i) => (
                        <li key={i}>{p.borrower_name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">
                      Tidak ada barang tercatat
                    </span>
                  )}
                </td>
                <td className="border-t border-black/10">cek</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
