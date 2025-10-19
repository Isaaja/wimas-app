"use client";

import { useState } from "react";
import Loading from "@/app/components/common/Loading";
import { useFilteredLoanHistory } from "@/hooks/useLoans";
import LoanTable from "@/app/components/borowwer/LoanTable";

export default function RiwayatPeminjamanPage() {
  const { loans, isLoading, isError, error } =
    useFilteredLoanHistory("completed");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  if (isLoading) return <Loading />;

  if (isError)
    return (
      <div className="alert alert-error mt-4">
        <span>Error: {error?.message || "Gagal memuat data peminjaman."}</span>
      </div>
    );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Riwayat Peminjaman
      </h1>

      <LoanTable
        loans={loans || []}
        isLoading={isLoading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
