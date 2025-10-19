"use client";

import { useEffect, useState } from "react";
import { Category, CategoryPayload } from "@/hooks/useCategories";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryPayload) => void;
  initialData?: Category | null;
  isSubmitting: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (initialData) {
      setCategoryName(initialData.category_name);
    } else {
      setCategoryName("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName) return;
    onSubmit({ category_name: categoryName });
  };

  return (
    <dialog className={`modal  ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box bg-white">
        <h3 className="font-bold text-lg mb-4">
          {initialData ? "Edit Kategori" : "Tambah Kategori Baru"}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text text-xs">Nama Kategori</span>
            </div>
            <input
              type="text"
              placeholder="Masukkan nama kategori"
              className="input input-bordered w-full bg-white border-2 border-gray-200"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </label>
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner text-indigo-500"></span>
              ) : initialData ? (
                "Simpan Perubahan"
              ) : (
                "Tambah"
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
