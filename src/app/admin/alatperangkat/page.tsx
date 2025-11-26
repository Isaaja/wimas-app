"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  Product,
  useRepairUnit,
  useDeleteUnit,
} from "@/hooks/useProducts";
import ProductTable from "@/app/components/admin/ProductsTable";
import DamagedItemsTable from "@/app/components/admin/DamagedItemsTable";
import LoanedItemsTable from "@/app/components/admin/LoanedItemsTable";
import ProductModal from "@/app/components/admin/ProductModal";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import Loading from "@/app/components/common/Loading";
import Swal from "sweetalert2";

type TabType = "products" | "damaged" | "loaned";

export default function AlatPerangkatPage() {
  const { data: products, isLoading, isError, error } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const repairUnit = useRepairUnit();
  const deleteUnit = useDeleteUnit();
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

  const handleRepair = async (unit: any, product: Product) => {
    const result = await Swal.fire({
      title: "Perbaiki Barang?",
      text: `Apakah Anda yakin ingin memperbaiki ${product.product_name} (${unit.serialNumber})? Status akan menjadi AVAILABLE.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Perbaiki!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await repairUnit.mutateAsync({
          product_id: product.product_id,
          unit_id: unit.unit_id,
          condition: "GOOD",
          note: "-",
        });
        toast.success(
          "Barang berhasil diperbaiki dan status menjadi AVAILABLE!"
        );
      } catch (error: any) {
        toast.error(error.message || "Gagal memperbaiki barang");
      }
    }
  };

  const handleRetire = async (unit: any, product: Product) => {
    const result = await Swal.fire({
      title: "Hapus Barang?",
      text: `Apakah Anda yakin ingin MENGHAPUS PERMANEN ${product.product_name} (${unit.serialNumber})? Tindakan ini tidak dapat dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await deleteUnit.mutateAsync({
          product_id: product.product_id,
          unit_id: unit.unit_id,
        });
        toast.success("Barang berhasil dihapus permanen!");
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus barang");
      }
    }
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
      <div className="flex flex-col lg:flex-row lg:justify-between items-center gap-4">
        <div className="flex flex-col w-full">
          <h1 className="lg:text-2xl text-xl font-bold">Alat & Perangkat</h1>

          <div className="flex lg:flex-row flex-col w-full items-center justify-between mt-2 gap-2">
            <div className="flex space-x-2 bg-gray-100 rounded-lg">
              <button
                className={`px-4 py-2 rounded-md lg:text-sm my-2 font-medium transition-all duration-200 text-xs ${
                  activeTab === "products"
                    ? "text-blue-600 border-b border-blue-600 bg-white/80 shadow-md"
                    : "text-gray-400 hover:text-black hover:border-b"
                }`}
                onClick={() => setActiveTab("products")}
              >
                Semua Produk
              </button>
              <button
                className={`px-4 py-2 rounded-md lg:text-sm my-2 font-medium transition-all duration-200 text-xs ${
                  activeTab === "loaned"
                    ? "text-green-600 border-b border-green-600 bg-white/80 shadow-md"
                    : "text-gray-400 hover:text-black hover:border-b"
                }`}
                onClick={() => setActiveTab("loaned")}
              >
                Barang Dipinjam
              </button>
              <button
                className={`px-4 py-2 rounded-md lg:text-sm my-2 font-medium transition-all duration-200 text-xs ${
                  activeTab === "damaged"
                    ? "text-red-600 border-b border-red-600 bg-white/80 shadow-md"
                    : "text-gray-400 hover:text-black hover:border-b"
                }`}
                onClick={() => setActiveTab("damaged")}
              >
                Barang Rusak
              </button>
            </div>
            <div className="flex gap-4 items-center">
              {activeTab === "products" && (
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
              )}

              {activeTab === "products" && (
                <button
                  className="flex text-white w-64 px-1 py-2 lg:text-base text-xs items-center justify-center bg-[#33A1E0] rounded-lg cursor-pointer hover:bg-[#33A1E0]/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  onClick={handleAdd}
                >
                  Tambah Perangkat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeTab === "products" ? (
        !products || products.length === 0 ? (
          <div className="alert alert-info">
            <span>Tidak ada data produk.</span>
          </div>
        ) : (
          <ProductTable
            products={paginatedProducts}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        )
      ) : activeTab === "damaged" ? (
        <DamagedItemsTable
          products={products || []}
          onRepair={handleRepair}
          onRetire={handleRetire}
        />
      ) : (
        <LoanedItemsTable
          products={products || []}
          onRepair={handleRepair}
          onRetire={handleRetire}
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
