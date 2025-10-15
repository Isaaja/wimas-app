"use client";

import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { X } from "lucide-react";

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
      <div className="modal-box max-w-2xl p-0 bg-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Detail Produk</h3>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex p-4 gap-4 ">
          {/* Product Image */}
          <div className="flex flex-col w-full gap-4 bg-gray-300 justify-center items-center rounded-lg shadow-md">
            <div className="flex justify-center">
              <img
                src={product.product_image}
                alt={product.product_name}
                className="w-48 h-48 object-cover rounded-lg"
              />
            </div>

            {/* Product Info */}
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">{product.product_name}</h2>
              <div className="badge badge-primary badge-lg">
                Stok: {product.product_avaible}
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-4">
            {/* Product Details */}
            <div className="space-y-2 text-sm w-2xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Kategori:</span>
                <span className="font-medium">{product.category?.category_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jumlah Barang:</span>
                <span className="font-medium">{product.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Deskripsi:</span>
                <p className="text-gray-700 mt-1">n/A</p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="bg-gray-300 rounded-lg shadow-md py-2">
              <label className="block text-sm font-medium mb-2 text-center">
                Jumlah Pinjam
              </label>
              <div className="flex items-center justify-center gap-3">
                <button
                  className="btn btn-sm btn-circle"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="input input-bordered input-sm w-16 text-center text-white  "
                  value={quantity}
                  min={1}
                  max={product.product_avaible}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value)))
                  }
                />
                <button
                  className="btn btn-sm btn-circle"
                  onClick={() =>
                    setQuantity((q) => Math.min(q + 1, product.product_avaible))
                  }
                >
                  +
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Maks: {product.product_avaible} unit
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="btn btn-outline flex-1" onClick={handleClose}>
                Batal
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={handleAddToCart}
                disabled={!canBorrow || quantity > product.product_avaible}
              >
                {!canBorrow ? "Tidak Bisa Pinjam" : "Tambah ke List"}
              </button>
            </div>

            {/* Status Messages */}
            {!canBorrow && (
              <div className="alert alert-warning">
                <span>⚠️ Ada pinjaman aktif</span>
              </div>
            )}

            {/* Summary */}
            <div className="alert alert-info">
              <span>
                Akan pinjam: <strong>{quantity} unit</strong>{" "}
                {product.product_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
