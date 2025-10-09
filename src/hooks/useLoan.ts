"use client";

import { useState } from "react";
import { useAuthContext } from "@/app/contexts/AuthContext";

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const localToken = localStorage.getItem("accessToken");
  if (localToken) return localToken;

  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

  return cookieToken || null;
};

export function useLoan() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const createLoan = async (
    items: { product_id: string; quantity: number }[]
  ) => {
    if (!user) throw new Error("User belum login");

    const token = getAccessToken();
    if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

    setIsLoading(true);

    try {
      const response = await fetch("/api/loan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.userId,
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Gagal membuat peminjaman");
      }

      return result.data;
    } catch (error) {
      console.error("Error saat membuat loan:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createLoan, isLoading };
}
