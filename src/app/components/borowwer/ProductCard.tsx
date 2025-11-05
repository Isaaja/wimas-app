"use client";

import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { toast } from "react-toastify";
import { Info, ArrowRight } from "lucide-react";
import ProductDetailModal from "./ProductDetailModal";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product, qty: number) => void;
  canBorrow?: boolean;
}

export default function ProductCard({
  product,
  onAdd,
  canBorrow = true,
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const imageSrc =
    product.product_image && product.product_image.trim() !== ""
      ? product.product_image
      : "/img/no-image.jpg";

  const handleAddToCart = (product: Product, quantity: number) => {
    onAdd(product, quantity);
    toast.success(
      `Berhasil menambahkan ${product.product_name} sebanyak ${quantity} ke daftar peminjaman.`
    );
  };

  const openModal = () => {
    if (!canBorrow) {
      toast.error("Anda tidak dapat meminjam karena memiliki pinjaman aktif");
      return;
    }
    if (product.product_avaible === 0) {
      toast.error("Stok produk habis");
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const isOutOfStock = product.product_avaible === 0;
  const isDisabled = !canBorrow || isOutOfStock;

  return (
    <>
      <div
        className={`card bg-white shadow-md hover:shadow-xl transition-all border border-gray-200 relative ${
          isOutOfStock ? "opacity-60" : ""
        }`}
      >
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-90 z-10 rounded-xl flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">😔</div>
              <h3 className="font-bold text-lg text-gray-700 mb-2">
                Stok Habis
              </h3>
              <p className="text-sm text-gray-600">
                {product.product_name} sedang tidak tersedia
              </p>
            </div>
          </div>
        )}

        <figure className="px-4 pt-4 relative h-28 sm:h-40 md:h-44">
          <Image
            src={imageSrc}
            alt={product.product_name}
            fill
            className={`rounded-xl object-cover cursor-pointer ${
              isOutOfStock
                ? "grayscale"
                : "hover:scale-105 transition-transform"
            }`}
            onClick={openModal}
            onError={(e) => {
              const target = e.currentTarget;
              target.src = "/img/no-image.jpg";
            }}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        </figure>

        <div className="card-body p-4 text-center">
          <h2
            className="font-bold text-sm sm:text-base md:text-lg cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
            onClick={openModal}
          >
            {product.product_name}
          </h2>
          <p
            className={`font-medium text-xs sm:text-sm ${
              isOutOfStock ? "text-gray-500" : "text-gray-600"
            }`}
          >
            Tersedia: {product.product_avaible}
          </p>
          {isOutOfStock && (
            <div className="badge badge-error text-xs sm:text-sm w-full justify-center py-2 sm:py-3">
              ❌ STOK HABIS
            </div>
          )}
          {canBorrow && !isOutOfStock && (
            <div className="card-actions justify-center mt-2 sm:mt-4">
              <button
                className="btn btn-info btn-xs sm:btn-sm w-full text-xs sm:text-sm"
                onClick={openModal}
              >
                <span className="hidden xs:inline">Lihat Detail</span>
                <span className="xs:hidden">Detail</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ProductDetailModal
        product={product}
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddToCart={handleAddToCart}
        canBorrow={canBorrow}
      />
    </>
  );
}
