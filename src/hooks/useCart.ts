"use client";
import { useState } from "react";
import { Product } from "@/hooks/useProducts";

export interface CartItem extends Product {
  quantity: number;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product_id === product.product_id
      );

      if (existing) {
        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart };
}
