"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/app/contexts/AuthContext";

// 🧩 Types
export interface LoanProduct {
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface InvitedUser {
  borrower_id: string;
  borrower_name: string;
  borrower_username: string;
}

export interface Loan {
  loan_id: string;
  user_id: string;
  status: string;
  loan_date: string;
  return_date: string | null;
  invited_users: InvitedUser[];
  products: LoanProduct[];
}

export interface LoanItem {
  product_id: string;
  quantity: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// 🧠 Ambil token dari localStorage atau cookie
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

// 📦 Fetch semua pinjaman
const fetchLoans = async (): Promise<Loan[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch("/api/loan", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal memuat data pinjaman");

  // sesuai payload baru → result.data langsung berupa array
  return result?.data || [];
};

// ✨ Buat pinjaman baru
const createLoan = async (payload: {
  userId: string;
  items: LoanItem[];
}): Promise<Loan> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch("/api/loan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal membuat pinjaman");

  // respons dari POST masih bisa berupa objek tunggal
  return result?.data as Loan;
};

// 🔥 Hook utama
export function useLoans() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // 🔹 Ambil semua loans
  const {
    data: loans = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["loans"],
    queryFn: fetchLoans,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // 🔹 Buat loan baru
  const { mutateAsync: createLoanMutation, isPending: isCreating } =
    useMutation({
      mutationFn: (items: LoanItem[]) => {
        if (!user) throw new Error("User belum login");
        return createLoan({ userId: user.userId, items });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["loans"] });
      },
      onError: (err: Error) => {
        console.error("Gagal membuat pinjaman:", err.message);
      },
    });

  // 🔹 Ekspor hook
  return {
    loans,
    isLoading,
    isError,
    error,
    createLoan: createLoanMutation,
    isCreating,
  };
}
