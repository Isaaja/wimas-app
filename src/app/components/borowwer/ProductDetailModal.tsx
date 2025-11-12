"use client";

import { useState, useEffect } from "react";
import { Product } from "@/hooks/useProducts";
import { X } from "lucide-react";
import Image from "next/image";

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  canBorrow?: boolean;
  availableUnits: number;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  canBorrow = true,
  availableUnits,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen, availableUnits]);

  const handleAddToCart = () => {
    if (!canBorrow) return;

    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  const handleClose = () => {
    setQuantity(1);
    onClose();
  };

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(value, availableUnits));
    setQuantity(newQuantity);
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-3xl w-11/12 sm:w-10/12 md:w-9/12 lg:max-w-3xl p-0 bg-white rounded-lg max-h-[80vh] sm:max-h-[85vh] lg:max-h-[80vh] overflow-hidden flex flex-col mt-12">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h3 className="font-bold text-base sm:text-lg text-gray-800">
            Detail Produk
          </h3>
          <button
            className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
            onClick={handleClose}
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto">
          <div className="flex flex-col w-full lg:w-2/3 p-3 sm:p-4 gap-3 lg:border-r lg:border-gray-200">
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex justify-center items-center min-h-[200px] sm:min-h-[250px] lg:min-h-0 lg:flex-1">
              <Image
                src={product.product_image || "/img/no-image.jpg"}
                width={280}
                height={280}
                alt={product.product_name || "Product image"}
                className="w-full h-auto max-w-xs sm:max-w-sm object-cover rounded-md"
                onError={(e) => {
                  e.currentTarget.src = "/img/no-image.jpg";
                }}
              />
            </div>

            <div className="lg:hidden text-center">
              <div
                className={`badge badge-lg px-3 py-2 text-xs font-semibold ${
                  availableUnits > 0
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {availableUnits > 0
                  ? `Tersedia: ${availableUnits} unit`
                  : "Stok Habis"}
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full lg:w-1/2 p-3 sm:p-4 gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 line-clamp-2">
                {product.product_name}
              </h2>
              <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
            </div>

            <div className="hidden lg:block text-center">
              <div
                className={`badge badge-lg px-3 py-2 text-xs font-semibold ${
                  availableUnits > 0
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {availableUnits > 0
                  ? `Tersedia: ${availableUnits} unit`
                  : "Stok Habis"}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 font-medium">Kategori:</span>
                <span className="font-semibold text-gray-800 text-right">
                  {product.category?.category_name || "-"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 font-medium">Total Stok:</span>
                <span className="font-semibold text-gray-800">
                  {product.quantity} unit
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 font-medium">Tersedia:</span>
                <span className="font-semibold text-gray-800">
                  {availableUnits} unit
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <label className="block text-xs font-semibold mb-2 text-gray-700 text-center">
                JUMLAH PINJAM
              </label>
              <div className="flex items-center justify-center gap-3">
                <button
                  className="btn btn-circle btn-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={!canBorrow || availableUnits === 0 || quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  className="input input-bordered input-sm w-16 text-center font-semibold text-gray-800 bg-white"
                  value={quantity}
                  min={1}
                  max={availableUnits}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  disabled={!canBorrow || availableUnits === 0}
                />
                <button
                  className="btn btn-circle btn-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={
                    !canBorrow ||
                    availableUnits === 0 ||
                    quantity >= availableUnits
                  }
                >
                  +
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Maks: {availableUnits} unit
              </p>
            </div>

            {!canBorrow && (
              <div className="alert alert-warning py-2 px-3 bg-yellow-50 border-yellow-200">
                <span className="text-yellow-800 text-xs sm:text-sm">
                  ⚠️ Ada pinjaman aktif
                </span>
              </div>
            )}

            {availableUnits === 0 && (
              <div className="alert alert-error py-2 px-3 bg-red-50 border-red-200">
                <span className="text-red-800 text-xs sm:text-sm">
                  ❌ Stok habis
                </span>
              </div>
            )}

            {canBorrow && availableUnits > 0 && (
              <div className="alert alert-info py-2 px-3 bg-blue-50 border-blue-200">
                <span className="text-blue-800 text-xs sm:text-sm">
                  Akan pinjam: <strong>{quantity} unit</strong>
                </span>
              </div>
            )}

            <div className="flex gap-2 mt-2 pt-2 bg-white sticky bottom-0 -mx-3 -mb-3 px-3 pb-3 sm:static sm:mx-0 sm:mb-0 sm:px-0 sm:pb-0">
              <button
                className="btn btn-outline btn-sm flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs py-2 h-auto"
                onClick={handleClose}
              >
                Batal
              </button>
              <button
                className="btn btn-primary btn-sm flex-1 bg-blue-600 border-blue-600 text-white hover:bg-blue-700 text-xs font-semibold py-2 h-auto"
                onClick={handleAddToCart}
                disabled={
                  !canBorrow ||
                  availableUnits === 0 ||
                  quantity > availableUnits
                }
              >
                {!canBorrow
                  ? "Tidak Bisa Pinjam"
                  : availableUnits === 0
                  ? "Stok Habis"
                  : "Pinjam Sekarang"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop bg-black/50">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
