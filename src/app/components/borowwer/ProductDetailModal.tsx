"use client";

import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { X } from "lucide-react";
import Image from "next/image";

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  canBorrow?: boolean;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  canBorrow = true,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState<number>(1);

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

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-3xl p-0 bg-white rounded-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header - Compact */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h3 className="font-bold text-lg text-gray-800">Detail Produk</h3>
          <button
            className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
            onClick={handleClose}
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content Area with Scroll */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex flex-col w-full lg:w-2/3 p-4 gap-3 border-r border-gray-200">
            <div className="bg-gray-50 rounded-3xl p-4 flex justify-center items-center overflow-y-auto">
              <Image
                src={product.product_image || "/img/no-image.jpg"}
                width={220}
                height={220}
                alt={product.product_name || "Product image"}
                className="lg:w-96 lg:h-80 object-cover rounded-md"
                onError={(e) => {
                  e.currentTarget.src = "/img/no-image.jpg";
                }}
              />
            </div>

            {/* Stock Badge */}
            <div className="text-center">
              <div
                className={`badge badge-lg px-3 py-2 text-xs font-semibold ${
                  product.product_avaible > 0
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {product.product_avaible > 0
                  ? `Tersedia: ${product.product_avaible}`
                  : "Stok Habis"}
              </div>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="flex flex-col w-full lg:w-1/2 p-4 gap-4 overflow-y-auto">
            {/* Product Name */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1 line-clamp-2">
                {product.product_name}
              </h2>
              <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
            </div>

            {/* Product Details - Compact */}
            <div className="space-y-3 text-sm">
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

              <div className="py-1">
                <span className="text-gray-600 font-medium block mb-1">
                  Deskripsi:
                </span>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-2 text-xs line-clamp-3">
                  &quot;Tidak ada deskripsi&quot;
                </p>
              </div>
            </div>

            {/* Quantity Selector - Compact */}
            <div className="bg-blue-50 rounded-lg p-3">
              <label className="block text-xs font-semibold mb-2 text-gray-700 text-center">
                JUMLAH PINJAM
              </label>
              <div className="flex items-center justify-center gap-3">
                <button
                  className="btn btn-circle btn-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!canBorrow || product.product_avaible === 0}
                >
                  -
                </button>
                <input
                  type="number"
                  className="input input-bordered input-sm w-16 text-center font-semibold text-gray-800 bg-white"
                  value={quantity}
                  min={1}
                  max={product.product_avaible}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(
                          Number(e.target.value),
                          product.product_avaible
                        )
                      )
                    )
                  }
                  disabled={!canBorrow || product.product_avaible === 0}
                />
                <button
                  className="btn btn-circle btn-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() =>
                    setQuantity((q) => Math.min(q + 1, product.product_avaible))
                  }
                  disabled={!canBorrow || product.product_avaible === 0}
                >
                  +
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Maks: {product.product_avaible} unit
              </p>
            </div>

            {/* Status Messages - Compact */}
            {!canBorrow && (
              <div className="alert alert-warning py-2 bg-yellow-50 border-yellow-200">
                <span className="text-yellow-800 text-sm">
                  ⚠️ Ada pinjaman aktif
                </span>
              </div>
            )}

            {product.product_avaible === 0 && (
              <div className="alert alert-error py-2 bg-red-50 border-red-200">
                <span className="text-red-800 text-sm">❌ Stok habis</span>
              </div>
            )}

            {/* Summary - Compact */}
            {canBorrow && product.product_avaible > 0 && (
              <div className="alert alert-info py-2 bg-blue-50 border-blue-200">
                <span className="text-blue-800 text-sm">
                  Akan pinjam: <strong>{quantity} unit</strong>
                </span>
              </div>
            )}

            {/* Action Buttons - Compact */}
            <div className="flex gap-2 mt-auto pt-2">
              <button
                className="btn btn-outline btn-sm flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                onClick={handleClose}
              >
                Batal
              </button>
              <button
                className="btn btn-primary btn-sm flex-1 bg-blue-600 border-blue-600 text-white hover:bg-blue-700 text-xs font-semibold"
                onClick={handleAddToCart}
                disabled={
                  !canBorrow ||
                  product.product_avaible === 0 ||
                  quantity > product.product_avaible
                }
              >
                {!canBorrow
                  ? "Tidak Bisa Pinjam"
                  : product.product_avaible === 0
                  ? "Stok Habis"
                  : "Pinjam Sekarang"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Backdrop */}
      <form method="dialog" className="modal-backdrop bg-black/50">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
