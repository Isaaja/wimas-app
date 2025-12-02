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
    units: [],
  });

  useEffect(() => {
    setFormData((prev) => {
      let units = [...prev.units];

      if (prev.quantity > units.length) {
        for (let i = units.length; i < prev.quantity; i++) {
          units.push({ serialNumber: "" });
        }
      } else if (prev.quantity < units.length) {
        units = units.slice(0, prev.quantity);
      }

      return { ...prev, units };
    });
  }, [formData.quantity]);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        category_id: productToEdit.category_id,
        product_name: productToEdit.product_name,
        product_image: productToEdit.product_image || "",
        quantity: productToEdit.quantity,
        units:
          productToEdit.units?.map((u) => ({
            serialNumber: u.serialNumber,
          })) || [],
      });
    } else {
      setFormData({
        category_id: "",
        product_name: "",
        product_image: "",
        quantity: 0,
        units: [],
      });
    }
  }, [productToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasEmptySerial = formData.units.some((u) => !u.serialNumber.trim());
    if (hasEmptySerial) {
      toast.error("Semua serial number harus diisi!");
      return;
    }

    const payload = {
      ...formData,
      units: formData.units.map((u) => ({
        serialNumber: u.serialNumber,
      })),
    };

    if (productToEdit) {
      updateProduct.mutate(
        {
          id: productToEdit.product_id,
          payload,
        },
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
      createProduct.mutate(payload, {
        onSuccess: () => {
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

      return { ...prev, [name]: parsedValue };
    });
  };

  if (!isOpen) return null;
  if (isLoading) return <p>Memuat kategori...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  const isEditMode = !!productToEdit;
  const selectedCategoryName =
    categories?.find((cat) => cat.category_id === formData.category_id)
      ?.category_name || "-";

  const availableCount = formData.units.filter((u) =>
    u.serialNumber.trim()
  ).length;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl bg-white shadow-2xl rounded-2xl mt-16 max-h-[80vh] overflow-hidden p-0 flex flex-col">
        <div
          className={`${
            isEditMode ? "bg-green-600" : "bg-blue-600"
          } p-6 rounded-t-2xl flex-shrink-0`}
        >
          <h3 className="font-bold text-2xl text-white">
            {isEditMode ? "Edit Produk" : "Tambah Produk Baru"}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="product-form" onSubmit={handleSubmit}>
            <div className="form-control mb-3">
              <label className="label">
                <span className="font-semibold">Nama Produk</span>
              </label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="input input-bordered bg-white border-black text-black w-full"
                required
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="font-semibold">URL Gambar (Opsional)</span>
              </label>
              <input
                type="url"
                name="product_image"
                value={formData.product_image}
                onChange={handleChange}
                className="input input-bordered bg-white border-black text-black w-full"
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="font-semibold">Kategori</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="select select-bordered w-full bg-white border-black"
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
                  <span className="font-semibold">{selectedCategoryName}</span>
                </p>
              )}
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="font-semibold">Jumlah Stok</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="input input-bordered bg-white border-black text-black w-full"
                min="0"
                required
              />

              {formData.quantity > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Ketersediaan (Good Condition):
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {availableCount} / {formData.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    *Dihitung otomatis dari serial number yang diisi
                  </p>
                </div>
              )}
            </div>

            {formData.quantity > 0 && (
              <div className="form-control mb-3">
                <label className="label">
                  <span className="font-semibold">
                    Serial Numbers ({formData.units.length} item)
                  </span>
                </label>

                <div className="space-y-2 max-h-[300px] overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {Array.from({ length: formData.quantity }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-600 w-8">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Serial Number ${idx + 1}`}
                        className="flex-1 input input-sm input-bordered bg-white border-gray-300 text-black"
                        value={formData.units[idx]?.serialNumber || ""}
                        onChange={(e) => {
                          const newUnits = [...formData.units];
                          newUnits[idx] = { serialNumber: e.target.value };
                          setFormData({ ...formData, units: newUnits });
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              Batal
            </button>
            <button
              type="submit"
              form="product-form"
              className={`btn text-white ${
                isEditMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {createProduct.isPending || updateProduct.isPending
                ? "Menyimpan..."
                : isEditMode
                ? "Perbarui"
                : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      <div className="modal-backdrop bg-black/30" onClick={onClose}></div>
    </div>
  );
}
