"use client";

import { useState } from "react";
import { useCreateProduct, CreateProductPayload } from "@/hooks/useProducts";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
}: AddProductModalProps) {
  const createProduct = useCreateProduct();
  const [formData, setFormData] = useState<CreateProductPayload>({
    product_name: "",
    product_image: "",
    quantity: 0,
    category_id: "",
    product_avaible: 1,
    status: "AVAILABLE",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createProduct.mutate(formData, {
      onSuccess: () => {
        alert("Produk berhasil ditambahkan!");
        setFormData({
          product_name: "",
          product_image: "",
          quantity: 0,
          category_id: "",
          product_avaible: 1,
          status: "AVAILABLE",
        });
        onClose();
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl bg-white shadow-2xl rounded-t-2xl">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 -m-6 mb-6 p-6 rounded-t-2xl">
          <h3 className="font-bold text-2xl text-white">Tambah Produk Baru</h3>
          <p className="text-blue-100 text-sm mt-1">
            Isi form di bawah untuk menambahkan produk
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-control">
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

            <div className="form-control">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Kategori ID
                  </span>
                </label>
                <input
                  type="text"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Masukkan ID kategori"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Status
                  </span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>
            </div>
          </div>

          {createProduct.isError && (
            <div className="alert alert-error mt-4 bg-red-50 border-red-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6 text-red-600"
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
              <span className="text-red-800">
                {createProduct.error?.message}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="btn btn-ghost hover:bg-gray-100"
              onClick={onClose}
              disabled={createProduct.isPending}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn bg-blue-600 hover:bg-blue-700 text-white border-none"
              disabled={createProduct.isPending}
            >
              {createProduct.isPending ? (
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
                  Simpan
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
