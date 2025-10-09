"use client";

import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { toast } from "react-toastify";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product, qty: number) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const [quantity, setQuantity] = useState<number>(1);

  const handleAdd = () => {
    if (quantity < 1) {
      toast.error("Jumlah peminjaman minimal 1.");
      return;
    }

    if (quantity > product.product_avaible) {
      toast.error(`Stok ${product.product_name} tidak mencukupi.`);
      return;
    }
    onAdd(product, quantity);
    toast.success(
      `Berhasil menambahkan ${product.product_name} sebanyak ${quantity} ke daftar peminjaman.`
    );
    setQuantity(1);
  };

  return (
    <div className="card bg-white shadow-md hover:shadow-xl transition-all border border-gray-200">
      <figure className="px-6 pt-6">
        <img
          src={product.product_image}
          alt={product.product_name}
          className="rounded-xl h-40 object-cover w-full"
        />
      </figure>

      <div className="card-body text-center">
        <h2 className="font-bold text-lg">{product.product_name}</h2>
        <p className="font-medium text-gray-600">
          Tersedia: {product.product_avaible}
        </p>

        <div className="flex justify-center items-center gap-3 mt-4">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-xs bg-gray-100 text-black border"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <input
              type="number"
              className="input input-bordered input-xs w-10 text-center bg-white"
              value={quantity}
              min={1}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <button
              className="btn btn-xs bg-gray-100 text-black border"
              onClick={() =>
                setQuantity((q) => Math.min(q + 1, product.product_avaible))
              }
            >
              +
            </button>
          </div>

          <button
            className="btn btn-xs btn-primary"
            onClick={handleAdd}
            disabled={product.product_avaible <= 0}
          >
            + Pinjam
          </button>
        </div>
      </div>
    </div>
  );
}
