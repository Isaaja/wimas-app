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
    if (window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      deleteMutation.mutate(categoryId);
    }
  };

  const handleSubmit = (payload: CategoryPayload) => {
    if (selectedCategory) {
      updateMutation.mutate(
        { id: selectedCategory.category_id, payload },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
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
        <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
        <button className="btn btn-primary" onClick={handleAddClick}>
          Tambah Kategori Baru
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
          isDeleting={deleteMutation.status === "pending"}
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
