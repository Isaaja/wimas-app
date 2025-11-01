"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  Product,
} from "@/hooks/useProducts";
import ProductTable from "@/app/components/shared/ProductsTable";
import ProductModal from "@/app/components/shared/ProductModal";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import Loading from "@/app/components/common/Loading";
import Swal from "sweetalert2";

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

  const handleDelete = (product: Product) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Produk "${product.product_name}" akan dihapus secara permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-error",
        cancelButton: "btn btn-secondary",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        deleteProduct.mutate(product.product_id, {
          onSuccess: () => {
            toast.success("Produk berhasil dihapus!");
          },
          onError: (err: any) => {
            toast.error(err.message);
          },
        });
      }
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col lg:flex-row justify-between items-center">
        <h1 className="lg:text-2xl text-xl font-bold text-gray-700">Alat & Perangkat</h1>
        <div className="flex gap-4">
          <label className="input input-bordered bg-white rounded-2xl flex items-center gap-2 w-full md:max-w-md">
            <svg
              className="h-[1.2em] w-[1.2em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input
              type="search"
              required
              placeholder="Cari perangkat..."
              className="grow outline-none bg-transparent text-gray-700"
              onChange={handleSearchChange}
            />
          </label>

          <button
            className="flex w-64 items-center justify-center bg-[#91C8E4] text-[#0B1D51] rounded-lg cursor-pointer hover:bg-[#91C8E4]/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            onClick={handleAdd}
          >
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
