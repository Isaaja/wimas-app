"use client";

import { useEffect, useState } from "react";
import {
  useCreateProduct,
  useUpdateProduct,
  CreateProductPayload,
  Product,
} from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "react-toastify";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (formData: any) => void;
}

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
}: AddProductModalProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories, isLoading, isError, error } = useCategories();

  const [formData, setFormData] = useState<CreateProductPayload>({
    category_id: "",
    product_name: "",
    product_image: "",
    quantity: 0,
    product_avaible: 1,
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        category_id: productToEdit.category_id,
        product_name: productToEdit.product_name,
        product_image: productToEdit.product_image,
        quantity: productToEdit.quantity,
        product_avaible: productToEdit.product_avaible,
      });
    } else {
      setFormData({
        category_id: "",
        product_name: "",
        product_image: "",
        quantity: 0,
        product_avaible: 1,
      });
    }
  }, [productToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (productToEdit) {
      updateProduct.mutate(
        { id: productToEdit.product_id, payload: formData },
        {
          onSuccess: () => {
            toast.success("Produk berhasil diperbarui!");
            onClose();
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } else {
      createProduct.mutate(formData, {
        onSuccess: () => {
          setFormData({
            category_id: "",
            product_name: "",
            product_image: "",
            quantity: 0,
            product_avaible: 1,
          });
          toast.success("Produk berhasil ditambahkan!");
          onClose();
        },
        onError: (error) => {
          toast.error(`Error: ${error.message}`);
        },
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      let parsedValue: number | string = value;

      if (type === "number") {
        parsedValue = Number(value);
        if (isNaN(parsedValue)) parsedValue = 0;
      }

      let newData = { ...prev, [name]: parsedValue };

      const toastId = "product-availability-warning";

      if (name === "product_avaible") {
        const product_avaible = parsedValue as number;
        const quantity = prev.quantity;

        if (product_avaible > quantity) {
          if (!toast.isActive(toastId)) {
            toast.warning("Ketersediaan tidak boleh melebihi jumlah stok!", {
              toastId,
              autoClose: 2000,
            });
          }
          newData.product_avaible = quantity;
        }

        if (product_avaible === 0) {
          if (!toast.isActive("product-unavailable")) {
            toast.info("Produk menjadi tidak tersedia.", {
              toastId: "product-unavailable",
              autoClose: 2000,
            });
          }
        }
      }

      return newData;
    });
  };

  if (!isOpen) return null;
  if (isLoading) return <p>Memuat kategori...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  const isEditMode = !!productToEdit;
  const selectedCategoryName =
    categories?.find((cat) => cat.category_id === formData.category_id)
      ?.category_name || "-";

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl bg-white shadow-2xl rounded-t-2xl">
        <div
          className={`${
            isEditMode
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          } -m-6 mb-6 p-6 rounded-t-2xl`}
        >
          <h3 className="font-bold text-2xl text-white">
            {isEditMode ? "Edit Produk" : "Tambah Produk Baru"}
          </h3>
          <p className="text-blue-100 text-sm mt-1">
            {isEditMode
              ? "Ubah informasi produk di bawah ini"
              : "Isi form di bawah untuk menambahkan produk baru"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">
                Nama Produk
              </span>
            </label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              className="input input-bordered w-full bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Masukkan nama produk"
              required
            />
          </div>

          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">
                URL Gambar
              </span>
            </label>
            <input
              type="url"
              name="product_image"
              value={formData.product_image}
              onChange={handleChange}
              className="input input-bordered w-full bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">
                  Jumlah Stok
                </span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="input input-bordered w-full bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">
                  Ketersediaan
                </span>
              </label>
              <input
                type="number"
                name="product_avaible"
                value={formData.product_avaible}
                onChange={handleChange}
                className="input input-bordered w-full bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="1"
                min="0"
                required
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  0 = Tidak tersedia, 1 = Tersedia
                </span>
              </label>
            </div>
          </div>

          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">
                Kategori
              </span>
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="select select-bordered w-full bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categories?.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>

            {formData.category_id && (
              <p className="text-sm text-gray-500 mt-1">
                Kategori terpilih:{" "}
                <span className="font-semibold text-blue-600">
                  {selectedCategoryName}
                </span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="btn btn-ghost hover:bg-gray-100 hover:text-black"
              onClick={onClose}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`btn border-none text-white ${
                isEditMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {createProduct.isPending || updateProduct.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {isEditMode ? "Perbarui" : "Simpan"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="modal-backdrop bg-black/30" onClick={onClose}></div>
    </div>
  );
}
