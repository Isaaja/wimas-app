"use client";

import { useState, useMemo, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import ProductCard from "@/app/components/ProductCard";
import { useLoans, type LoanItem } from "@/hooks/useLoans";
import { useCheckUserLoan } from "@/hooks/useLoans";
import { toast } from "react-toastify";
import { MessageSquareWarning, ShoppingBag } from "lucide-react";
import CartSummary from "@/app/components/CartSummary";
import debounce from "lodash.debounce";
import Loading from "@/app/components/Loading";

export default function AlatPerangkatPage() {
  const { data: products = [], isLoading, isError, error } = useProducts();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { createLoan, isCreating } = useLoans();
  const { data: checkResult, isLoading: isLoadingCheck } = useCheckUserLoan();

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

  const canBorrow = checkResult?.canBorrow ?? true;
  const reason = checkResult?.reason || "";

  const handleCheckout = async (
    invitedUserIds: string[],
    docsFile?: File | null,
    reportData?: any
  ) => {
    if (cart.length === 0) {
      toast.warning("Keranjang masih kosong!");
      return;
    }

    if (!canBorrow) {
      toast.error(`Tidak dapat meminjam: ${reason}`);
      return;
    }

    const items: LoanItem[] = cart.map((c) => ({
      product_id: c.product_id,
      quantity: c.quantity,
    }));

    try {
      await createLoan({
        users: invitedUserIds,
        items: items,
        docs: docsFile,
        report: reportData,
      });
      clearCart();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Checkout error:", error);
    }
  };

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleOpenModal = () => {
    if (cart.length === 0) {
      toast.warning("Keranjang masih kosong!");
      return;
    }

    if (!canBorrow) {
      toast.error(`Tidak dapat meminjam: ${reason}`);
      return;
    }

    setIsModalOpen(true);
  };

  if (isLoadingCheck) {
    return <Loading />;
  }

  if (isLoading) return <Loading />;

  if (isError)
    return (
      <div className="alert alert-error">
        <span>Error: {error?.message || "Terjadi kesalahan"}</span>
      </div>
    );

  return (
    <div className="flex flex-col max-h-screen bg-gray-200 mt-6 rounded-md shadow-xl p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 px-4 gap-4">
        <input
          type="text"
          placeholder="Cari perangkat..."
          className="input input-bordered input-info bg-white w-full md:max-w-md"
          onChange={handleSearchChange}
        />

        {canBorrow && (
          <button
            className="relative btn btn-accent text-black w-full md:w-auto"
            onClick={handleOpenModal}
            disabled={cart.length === 0}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Pinjam Sekarang</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        )}
      </div>

      {!canBorrow && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-4 mb-4">
          <p className="text-sm text-red-800 text-center">
            ⚠️ Anda tidak dapat membuat pinjaman baru karena memiliki pinjaman
            aktif. Selesaikan atau tunggu hingga pinjaman saat ini selesai
            terlebih dahulu.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto w-full max-h-[73vh] rounded-md px-4 pb-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <ProductCard
              key={p.product_id}
              product={p}
              onAdd={addToCart}
              canBorrow={canBorrow}
            />
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
