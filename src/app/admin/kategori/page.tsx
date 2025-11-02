"use client";

import { useState } from "react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  Category,
  CategoryPayload,
} from "@/hooks/useCategories";
import CategoryModal from "@/app/components/borowwer/CategoryModal";
import CategoryTable from "@/app/components/borowwer/CategoryTable";
import Loading from "@/app/components/common/Loading";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { CirclePlus, Plus } from "lucide-react";

export default function CategoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const { data, isLoading, isError, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleAddClick = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (categoryId: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Anda akan menghapus kategori ini!",
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
        deleteMutation.mutate(categoryId);
        toast.success("Kategori berhasil dihapus!");
      }
    });
  };

  const handleSubmit = (payload: CategoryPayload) => {
    if (selectedCategory) {
      updateMutation.mutate(
        { id: selectedCategory.category_id, payload },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            toast.success("Produk berhasil ditambah!");
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("Produk berhasil ditambah!");
        },
      });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="lg:text-2xl text-xl font-bold">Manajemen Kategori</h1>
        <button
          className="btn btn-primary lg:flex hidden"
          onClick={handleAddClick}
        >
          Tambah Kategori Baru
        </button>
        <button
          className="flex lg:hidden fixed bottom-8 right-8 bg-primary/90 backdrop-blur-sm p-3 rounded-full shadow-2xl border border-white/20 hover:bg-primary transition-all duration-300 hover:scale-110 hover:shadow-primary/40"
          onClick={handleAddClick}
        >
          <Plus
            className="h-10 w-10 transition-transform duration-300 hover:rotate-180"
            color="white"
          />
        </button>
      </div>

      {isError && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Gagal memuat data: {error?.message}</span>
        </div>
      )}
      {data && (
        <CategoryTable
          categories={data}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedCategory}
        isSubmitting={
          createMutation.status === "pending" ||
          updateMutation.status === "pending"
        }
      />
    </div>
  );
}
