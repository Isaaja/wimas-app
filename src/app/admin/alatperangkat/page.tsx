"use client";

import { useState, useMemo } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
import ProductTable from "../../components/ProductsTable";

export default function ProductsPage() {
  const { data: products, isLoading, isError, error } = useProducts();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { paginatedProducts, totalPages } = useMemo(() => {
    if (!products) return { paginatedProducts: [], totalPages: 0 };

    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return { paginatedProducts, totalPages };
  }, [products, currentPage]);

  const handleEdit = (product: Product) => {
    console.log("Edit:", product);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Hapus ${product.product_name}?`)) {
      console.log("Delete:", product);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="alert alert-error">
        <span>Error: {error?.message || "Terjadi kesalahan"}</span>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="alert alert-info">
        <span>Tidak ada data produk.</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ProductTable
        products={paginatedProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
