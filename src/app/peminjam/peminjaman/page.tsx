"use client";

import { useState } from "react";
import Loading from "@/app/components/common/Loading";
import { useFilteredLoanHistory } from "@/hooks/useLoans";
import LoanTable from "@/app/components/borowwer/LoanTable";

export default function PeminjamanPage() {
  const { loans, isLoading, isError, error } = useFilteredLoanHistory("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  if (isLoading) return <Loading />;

  if (isError)
    return (
      <div className="alert alert-error mt-4">
        <span>Error: {error?.message || "Gagal memuat data peminjaman."}</span>
      </div>
    );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="lg:text-2xl text-xl font-bold mb-4">Daftar Peminjaman Aktif</h1>

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
