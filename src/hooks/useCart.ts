"use client";
import { useState, useCallback, useMemo } from "react";
import { Product } from "@/hooks/useProducts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LOAN_QUERY_KEYS } from "@/hooks/useLoans";

export interface CartItem extends Product {
  quantity: number;
}

interface UseCartOptions {
  enableOptimisticUpdates?: boolean;
  onCheckoutSuccess?: () => void;
  onCheckoutError?: (error: Error) => void;
}

// ==================== OPTIMIZED CART HOOK ====================

export function useCart(options: UseCartOptions = {}) {
  const {
    enableOptimisticUpdates = true,
    onCheckoutSuccess,
    onCheckoutError,
  } = options;

  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Persist cart changes to localStorage
  useState(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  });

  // Checkout mutation dengan optimistic updates
  const checkoutMutation = useMutation({
    mutationFn: async (checkoutData: {
      users: string[];
      items: Array<{ product_id: string; quantity: number }>;
      docs?: File | null;
      report?: any;
    }) => {
      // Your existing checkout API call
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("user", JSON.stringify(checkoutData.users));
      formData.append("items", JSON.stringify(checkoutData.items));

      if (checkoutData.report) {
        formData.append("report", JSON.stringify(checkoutData.report));
      }
      if (checkoutData.docs) {
        formData.append("docs", checkoutData.docs);
      }

      const response = await fetch("/api/loan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal membuat peminjaman");
      }

      return response.json();
    },
    onMutate: async (checkoutData) => {
      if (!enableOptimisticUpdates) return;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: LOAN_QUERY_KEYS.lists() });
      await queryClient.cancelQueries({ queryKey: LOAN_QUERY_KEYS.check() });

      // Snapshot previous values
      const previousLoans = queryClient.getQueryData(LOAN_QUERY_KEYS.lists());
      const previousCheck = queryClient.getQueryData(LOAN_QUERY_KEYS.check());

      // Optimistically update loans list
      const optimisticLoan = {
        loan_id: `temp-${Date.now()}`,
        status: "REQUESTED" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        borrower: { user_id: "", username: "Current User" },
        owner: { user_id: "", username: "Current User" },
        invited_users: checkoutData.users.map((userId) => ({
          user_id: userId,
          username: `user-${userId}`,
        })),
        items: checkoutData.items.map((item) => ({
          product_id: item.product_id,
          product_name: `Product ${item.product_id}`,
          quantity: item.quantity,
          loan_item_id: `temp-${Date.now()}-${item.product_id}`,
        })),
        report: checkoutData.report
          ? {
              report_id: `temp-${Date.now()}`,
              spt_file: null,
              ...checkoutData.report,
            }
          : undefined,
        isOptimistic: true,
      };

      queryClient.setQueryData(LOAN_QUERY_KEYS.lists(), (old: any[] = []) => [
        ...old,
        optimisticLoan,
      ]);

      // Optimistically update user check
      queryClient.setQueryData(LOAN_QUERY_KEYS.check(), {
        canBorrow: false,
        reason: "Anda memiliki peminjaman yang sedang diproses",
      });

      return { previousLoans, previousCheck, cartItems: [...cart] };
    },
    onSuccess: (data, variables, context) => {
      // Clear cart on successful checkout
      setCart([]);
      localStorage.removeItem("cart");

      if (enableOptimisticUpdates && context) {
        // Remove optimistic loan and replace with real data
        queryClient.setQueryData(LOAN_QUERY_KEYS.lists(), (old: any[] = []) =>
          old.filter((loan) => !loan.isOptimistic)
        );

        // Update with real data
        queryClient.setQueryData(LOAN_QUERY_KEYS.detail(data.loan_id), data);
        queryClient.setQueryData(LOAN_QUERY_KEYS.lists(), (old: any[] = []) => [
          ...old,
          data,
        ]);

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.lists() });
        queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.check() });
      }

      onCheckoutSuccess?.();
    },
    onError: (error, variables, context) => {
      if (enableOptimisticUpdates && context) {
        // Rollback optimistic updates
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.lists(),
          context.previousLoans
        );
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.check(),
          context.previousCheck
        );
      }

      onCheckoutError?.(error);
    },
    onSettled: () => {
      // Always invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.check() });
    },
  });

  // ==================== OPTIMIZED CART ACTIONS ====================

  const addToCart = useCallback((product: Product, qty: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product_id === product.product_id
      );

      if (existingIndex >= 0) {
        const updatedCart = [...prev];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + qty,
        };
        return updatedCart;
      }

      return [...prev, { ...product, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id: string, qty: number) => {
      if (qty <= 0) {
        removeFromCart(id);
        return;
      }

      setCart((prev) =>
        prev.map((item) =>
          item.product_id === id ? { ...item, quantity: qty } : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem("cart");
  }, []);

  // ==================== OPTIMIZED CHECKOUT FUNCTION ====================

  const handleCheckout = useCallback(
    (invitedUserIds: string[], docsFile?: File | null, reportData?: any) => {
      const cartItems = cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      checkoutMutation.mutate({
        users: invitedUserIds,
        items: cartItems,
        docs: docsFile,
        report: reportData,
      });
    },
    [cart, checkoutMutation]
  );

  // ==================== COMPUTED VALUES ====================

  const totalItems = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce((total, item) => {
        const itemPrice =
          typeof item.product_avaible === "number" ? item.product_avaible : 0;
        return total + itemPrice * item.quantity;
      }, 0),
    [cart]
  );

  const itemCount = useMemo(() => cart.length, [cart]);
  const isCartEmpty = useMemo(() => cart.length === 0, [cart]);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = cart.find((item) => item.product_id === productId);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  const isInCart = useCallback(
    (productId: string) => {
      return cart.some((item) => item.product_id === productId);
    },
    [cart]
  );

  const validateCart = useCallback((): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    cart.forEach((item) => {
      if (item.quantity > item.product_avaible) {
        errors.push(
          `${item.product_name} melebihi stok yang tersedia (Stok: ${item.product_avaible})`
        );
      }
      if (item.quantity <= 0) {
        errors.push(`${item.product_name} memiliki jumlah tidak valid`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [cart]);

  return {
    cart,

    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,

    handleCheckout,
    isCheckingOut: checkoutMutation.isPending,
    checkoutError: checkoutMutation.error,

    totalItems,
    totalPrice,
    itemCount,
    isCartEmpty,
    getItemQuantity,
    isInCart,
    validateCart,
  };
}
