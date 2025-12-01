"use client";

import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { toast } from "react-toastify";
import { ArrowRight, ShoppingCart } from "lucide-react";
import ProductDetailModal from "./ProductDetailModal";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product, qty: number) => void;
  canBorrow?: boolean;
  currentCartQuantity?: number;
}

const calculateAvailableUnits = (
  units: any[] = [],
  product_available?: number
): number => {
  if (units && units.length > 0) {
    const actuallyAvailable = units.filter(
      (unit) => unit.status === "AVAILABLE" && unit.condition === "GOOD"
    ).length;
    return actuallyAvailable;
  }

  return product_available || 0;
};

export default function ProductCard({
  product,
  onAdd,
  canBorrow = true,
  currentCartQuantity,
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableUnits = calculateAvailableUnits(product.units);
  const isOutOfStock = availableUnits === 0;

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

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canBorrow) {
      toast.error("Anda tidak dapat meminjam karena memiliki pinjaman aktif");
      return;
    }
    if (availableUnits === 0) {
      toast.error("Stok produk habis");
      return;
    }

    if ((currentCartQuantity || 0) >= availableUnits) {
      toast.error(
        `Stok tidak mencukupi. Tersedia: ${availableUnits}, Di keranjang: ${currentCartQuantity}`
      );
      return;
    }

    handleAddToCart(product, 1);
  };

  const openModal = () => {
    if (!canBorrow) {
      toast.error("Anda tidak dapat meminjam karena memiliki pinjaman aktif");
      return;
    }
    if (availableUnits === 0) {
      toast.error("Stok produk habis");
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
            className="font-bold lg:text-base text-xs cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
            onClick={openModal}
          >
            {product.product_name}
          </h2>
          <p
            className={`font-medium text-xs sm:text-sm ${
              isOutOfStock ? "text-gray-500" : "text-gray-600"
            }`}
          >
            Tersedia: {availableUnits}
          </p>
          {isOutOfStock && (
            <div className="badge badge-error text-xs sm:text-sm w-full justify-center py-2 sm:py-3">
              ❌ STOK HABIS
            </div>
          )}
          {canBorrow && !isOutOfStock && (
            <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-3 w-full">
              <button
                className="btn btn-info w-full md:flex-1 h-auto min-h-[2.5rem] md:min-h-[2rem] lg:min-h-[2.5rem] text-sm transition-all hover:brightness-110"
                onClick={openModal}
              >
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="hidden md:inline text-white">
                    Lihat Detail
                  </span>
                  <span className="md:hidden text-white">Detail</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-white ml-1" />
                </div>
              </button>

              <button
                onClick={handleQuickAdd}
                className="btn w-full md:w-12 h-auto min-h-[2.5rem] md:min-h-[2rem] lg:min-h-[2.5rem] bg-green-500 hover:bg-green-600 border-0 text-white shadow-lg transition-all hover:brightness-110"
                title="Tambah ke Keranjang"
              >
                <ShoppingCart className="w-4 h-4 mx-auto" />
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
        availableUnits={availableUnits}
        currentCartQuantity={currentCartQuantity}
      />
    </>
  );
}
