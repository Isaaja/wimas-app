"use client";

import { useState, useMemo } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
import ProductTable from "../../components/ProductsTable";
import AddProductModal from "@/app/components/AddProductModal";

export default function ProductsPage() {
  const { data: products, isLoading, isError, error } = useProducts();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <div className="mt-4 p-5 flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          className="btn btn-outline btn-info"
          onClick={() => setIsModalOpen(true)}
        >
          Tambah Perangkat
        </button>
      </div>
      {!products || products.length === 0 ? (
        <div className="alert alert-info">
          <span>Tidak ada data produk.</span>
        </div>
      ) : (
        <ProductTable
          products={paginatedProducts}
          currentPage={currentPage}
          totalPages={totalPages}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
        />
      )}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
