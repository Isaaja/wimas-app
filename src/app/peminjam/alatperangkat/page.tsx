"use client";

import { useState, useMemo, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import ProductCard from "@/app/components/ProductCard";
import { useLoans } from "@/hooks/useLoans";
import { toast } from "react-toastify";
import { ShoppingBag } from "lucide-react";
import CartSummary from "@/app/components/CartSummary";
import debounce from "lodash.debounce";

export default function AlatPerangkatPage() {
  const { data: products = [], isLoading, isError, error } = useProducts();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { createLoan, isCreating } = useLoans();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term.toLowerCase());
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    return products.filter((p) =>
      p.product_name.toLowerCase().includes(searchTerm)
    );
  }, [products, searchTerm]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning("Keranjang masih kosong!");
      return;
    }

    const items = cart.map((c) => ({
      product_id: c.product_id,
      quantity: c.quantity,
    }));

    try {
      await createLoan(items);
      toast.success("Peminjaman berhasil dibuat!");
      clearCart();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memproses peminjaman");
    }
  };

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center p-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  if (isError)
    return (
      <div className="alert alert-error">
        <span>Error: {error?.message || "Terjadi kesalahan"}</span>
      </div>
    );

  return (
    <div className="flex flex-col max-h-screen bg-gray-200 mt-6 rounded-md shadow-xl p-4">
      <div className="flex justify-between items-center mb-4 px-4">
        <input
          type="text"
          placeholder="Cari perangkat..."
          className="input input-bordered input-info bg-white w-full max-w-md"
          onChange={handleSearchChange}
        />

        <button
          className="relative btn btn-accent text-black"
          onClick={() => setIsModalOpen(true)}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="">Pinjam Sekarang</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto w-full max-h-[73vh] rounded-md px-4 pb-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <ProductCard key={p.product_id} product={p} onAdd={addToCart} />
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            Tidak ada perangkat yang cocok dengan pencarian.
          </p>
        )}
      </div>

      {isModalOpen && (
        <CartSummary
          cart={cart}
          onRemove={removeFromCart}
          onUpdateQty={updateQuantity}
          onCheckout={handleCheckout}
          onClose={() => setIsModalOpen(false)}
          isLoading={isCreating}
        />
      )}
    </div>
  );
}
