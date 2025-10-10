"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  Product,
} from "@/hooks/useProducts";
import ProductTable from "@/app/components/ProductsTable";
import ProductModal from "@/app/components/ProductModal";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import Loading from "@/app/components/Loading";

export default function AlatPerangkatPage() {
  const { data: products, isLoading, isError, error } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 4;

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term.toLowerCase());
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const { paginatedProducts, totalPages } = useMemo(() => {
    if (!products) return { paginatedProducts: [], totalPages: 0 };

    const filtered = searchTerm
      ? products.filter((p) =>
          p.product_name.toLowerCase().includes(searchTerm)
        )
      : products;

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    return { paginatedProducts, totalPages };
  }, [products, currentPage, searchTerm]);

  const handleAdd = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDelete = (product: any) => {
    deleteProduct.mutate(product.product_id, {
      onSuccess: () => toast.success("Produk berhasil dihapus!"),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleSave = (formData: any) => {
    if (productToEdit) {
      updateProduct.mutate(
        {
          id: productToEdit.product_id,
          payload: formData,
        },
        {
          onSuccess: () => toast.success("Produk berhasil diperbarui!"),
          onError: (err: any) => toast.error(err.message),
        }
      );
    } else {
      createProduct.mutate(formData, {
        onSuccess: () => toast.success("Produk berhasil ditambahkan!"),
        onError: (err: any) => toast.error(err.message),
      });
    }
    setIsModalOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="alert alert-error">
        <span>Error: {error?.message || "Terjadi kesalahan"}</span>
      </div>
    );
  }

  return (
    <div className="mt-4  flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alat & Perangkat</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari perangkat..."
            className="input input-info bg-white"
            onChange={handleSearchChange}
          />
          <button className="btn btn-info" onClick={handleAdd}>
            Tambah Perangkat
          </button>
        </div>
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
        onSave={handleSave}
      />
    </div>
  );
}
