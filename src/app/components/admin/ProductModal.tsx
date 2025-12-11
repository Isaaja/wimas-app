"use client";

import { useEffect, useState, useRef } from "react";
import {
  useCreateProduct,
  useUpdateProduct,
  CreateProductPayload,
  Product,
} from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "react-toastify";
import Image from "next/image";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave?: (formData: any) => void;
}

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
  onSave,
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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (productToEdit.product_image) {
        setImagePreview(productToEdit.product_image);
      }
    } else {
      setFormData({
        category_id: "",
        product_name: "",
        product_image: "",
        quantity: 0,
        units: [],
      });
      setImageFile(null);
      setImagePreview("");
    }
  }, [productToEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Hanya file JPG, PNG, atau WebP yang diizinkan");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          imageFile: imageFile || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Produk berhasil diperbarui!");
            if (onSave) onSave(payload);
            resetForm();
            onClose();
          },
          onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } else {
      createProduct.mutate(
        {
          payload,
          imageFile: imageFile || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Produk berhasil ditambahkan!");
            if (onSave) onSave(payload);
            resetForm();
            onClose();
          },
          onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      product_name: "",
      product_image: "",
      quantity: 0,
      units: [],
    });
    setImageFile(null);
    setImagePreview("");
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

  if (isLoading)
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="flex items-center justify-center p-4">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">Memuat kategori...</span>
          </div>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="alert alert-error">
            <span>Error: {error?.message}</span>
          </div>
        </div>
      </div>
    );

  const isEditMode = !!productToEdit;
  const selectedCategoryName =
    categories?.find((cat) => cat.category_id === formData.category_id)
      ?.category_name || "-";

  const availableCount = formData.units.filter((u) =>
    u.serialNumber.trim()
  ).length;

  const isSaving = createProduct.isPending || updateProduct.isPending;

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
            <div className="form-control mb-4">
              <label className="label">
                <span className="font-semibold">Nama Produk *</span>
              </label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="input input-bordered bg-white border-gray-300 text-black w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Masukkan nama produk"
                required
                disabled={isSaving}
              />
            </div>

            {/* Upload Gambar */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="font-semibold">Gambar Produk</span>
                <span className="text-xs text-gray-500">(Opsional)</span>
              </label>

              <div className="space-y-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                    imageFile
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    disabled={isSaving}
                  />

                  {imageFile ? (
                    <div className="space-y-2">
                      <div className="text-blue-600">
                        <svg
                          className="w-12 h-12 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="font-semibold text-gray-700 truncate">
                        {imageFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Klik untuk mengganti gambar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg
                          className="w-12 h-12 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="font-semibold text-gray-700">
                        Klik untuk upload gambar
                      </p>
                      <p className="text-sm text-gray-500">
                        JPG, PNG, atau WebP (max. 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {isEditMode && formData.product_image && !imageFile && (
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Gambar saat ini:</span>{" "}
                    <a
                      href={formData.product_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Lihat gambar
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="font-semibold">Kategori *</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="select select-bordered w-full bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
                disabled={isSaving}
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

            <div className="form-control mb-4">
              <label className="label">
                <span className="font-semibold">Jumlah Stok *</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="input input-bordered bg-white border-gray-300 text-black w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                min="0"
                required
                disabled={isSaving}
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
              <div className="form-control mb-4">
                <label className="label">
                  <span className="font-semibold">
                    Serial Numbers ({formData.units.length} item) *
                  </span>
                </label>

                <div className="space-y-2 max-h-[300px] overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                  {Array.from({ length: formData.quantity }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-white rounded border"
                    >
                      <span className="text-sm font-semibold text-gray-600 w-8">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Serial Number ${idx + 1}`}
                        className="flex-1 input input-sm input-bordered bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={formData.units[idx]?.serialNumber || ""}
                        onChange={(e) => {
                          const newUnits = [...formData.units];
                          newUnits[idx] = { serialNumber: e.target.value };
                          setFormData({ ...formData, units: newUnits });
                        }}
                        required
                        disabled={isSaving}
                      />
                    </div>
                  ))}
                </div>

                {formData.quantity > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    *Harap isi semua serial number untuk setiap unit
                  </p>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost hover:bg-gray-100"
              onClick={onClose}
              disabled={isSaving}
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
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Menyimpan...
                </>
              ) : isEditMode ? (
                "Perbarui"
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="modal-backdrop bg-black/30" onClick={onClose}></div>
    </div>
  );
}
