"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import ProductCard from "@/app/components/borowwer/ProductCard";
import { useLoans, type LoanItem } from "@/hooks/useLoans";
import { useCheckUserLoan } from "@/hooks/useLoans";
import { toast } from "react-toastify";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import CartSummary from "@/app/components/borowwer/CartSummary";
import debounce from "lodash.debounce";
import Loading from "@/app/components/common/Loading";
import { useRouter } from "next/navigation";

function sortProductsWithOutOfStockLast(products: any[]): any[] {
  return [...products].sort((a, b) => {
    const calculateAvailable = (product: any) => {
      if (product.units && product.units.length > 0) {
        return product.units.filter(
          (u: any) => u.status === "AVAILABLE" && u.condition === "GOOD"
        ).length;
      }
      return product.product_avaible || 0;
    };

    const aAvailable = calculateAvailable(a);
    const bAvailable = calculateAvailable(b);

    if (aAvailable === 0 && bAvailable > 0) return 1;
    if (bAvailable === 0 && aAvailable > 0) return -1;
    return 0;
  });
}

export default function AlatPerangkatPage() {
  const { data: products = [], isLoading, isError, error } = useProducts();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { createLoan, isCreating } = useLoans();
  const { data: checkResult, isLoading: isLoadingCheck } = useCheckUserLoan();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const getCartQuantity = useCallback(
    (productId: string) => {
      const cartItem = cart.find((item) => item.product_id === productId);
      return cartItem ? cartItem.quantity : 0;
    },
    [cart]
  );

  const handleAddToCart = useCallback(
    (product: any, quantity: number) => {
      const currentQty = getCartQuantity(product.product_id);
      const availableUnits =
        product.units?.filter((u: any) => u.status === "AVAILABLE").length || 0;

      if (currentQty + quantity > availableUnits) {
        toast.error(
          `Stok tidak mencukupi! Tersedia: ${availableUnits}, Di keranjang: ${currentQty}`
        );
        return;
      }

      addToCart(product, quantity);
    },
    [cart, addToCart, getCartQuantity]
  );

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term.toLowerCase());
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    if (searchTerm) {
      filtered = products.filter((p) =>
        p.product_name.toLowerCase().includes(searchTerm)
      );
    }

    return sortProductsWithOutOfStockLast(filtered);
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

    console.log("✅ invitedUserIds:", invitedUserIds);
    console.log("✅ items:", items);
    console.log("✅ reportData:", reportData);

    try {
      await createLoan({
        user: invitedUserIds,
        items: items,
        docs: docsFile,
        report: reportData,
      });
      clearCart();
      setIsModalOpen(false);
      setShowFloatingButton(false);
      router.push("/peminjam/peminjaman");
    } catch (error: any) {
      console.error("Checkout error:", error);
    }
  };

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    if (cart.length > 0 && canBorrow) {
      setShowFloatingButton(true);
    } else {
      setShowFloatingButton(false);
    }
  }, [cart.length, canBorrow]);

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

  const handleCloseFloatingButton = () => {
    setShowFloatingButton(false);
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
    <>
      <h1 className="px-4 mt-4 lg:text-2xl text-xl font-bold text-center lg:text-left">
        Alat & Perangkat
      </h1>
      <div className="flex flex-col max-h-screen bg-gray-200 m-4 rounded-2xl shadow-xl p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 lg:px-4 px-2 gap-4">
          <label className="input input-bordered bg-white rounded-2xl flex items-center gap-2 w-full md:max-w-md">
            <svg
              className="h-[1.2em] w-[1.2em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input
              type="search"
              required
              placeholder="Cari perangkat..."
              className="grow outline-none bg-transparent text-gray-700"
              onChange={handleSearchChange}
            />
          </label>
        </div>

        {!canBorrow && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-2 mb-4">
            <p className="text-sm text-red-800 text-center">
              ⚠️ Anda tidak dapat membuat pinjaman baru karena memiliki pinjaman
              aktif. Selesaikan atau tunggu hingga pinjaman saat ini selesai
              terlebih dahulu.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 gap-2 overflow-y-auto w-full max-h-[73vh] rounded-md lg:px-4 px-2 pb-4">
          {filteredAndSortedProducts.length > 0 ? (
            filteredAndSortedProducts.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                onAdd={handleAddToCart}
                canBorrow={canBorrow}
                currentCartQuantity={getCartQuantity(p.product_id)}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              Tidak ada perangkat yang cocok dengan pencarian.
            </p>
          )}
        </div>

        {/* Floating Button */}
        {showFloatingButton && (
          <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 lg:bottom-12 lg:right-20 z-50">
            <div className="flex items-center bg-white rounded-2xl shadow-2xl border-2 border-gray-300 overflow-hidden">
              <div className="px-3 py-3 sm:px-4 sm:py-3 lg:px-5 lg:py-4 bg-gray-50 border-r border-gray-200">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border-2 border-white shadow-lg text-[10px] sm:text-xs">
                      {totalItems > 99 ? "99+" : totalItems}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleOpenModal}
                className="btn btn-accent text-black hover:bg-accent-focus shadow-none border-none rounded-none transform hover:scale-105 transition-all duration-200 px-4 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 min-h-0 h-auto group"
                disabled={isCreating}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-medium font-sans text-sm sm:text-base lg:text-lg whitespace-nowrap">
                    Pinjam Sekarang
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>
        )}

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
    </>
  );
}
