"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { toast } from "react-toastify";

/* -------------------- Interfaces -------------------- */
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

/* -------------------- Token Helper -------------------- */
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

/* -------------------- Fetch All Loans -------------------- */
const fetchLoans = async (): Promise<Loan[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch("/api/loan", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal memuat data peminjaman");

  return Array.isArray(result?.data) ? result.data : [];
};

const createLoan = async (formData: FormData) => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch("/api/loan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  const result = await response.json().catch(async () => {
    const text = await response.text();
    console.error("Response bukan JSON:", text.slice(0, 200));
    throw new Error("Server mengembalikan response bukan JSON");
  });

  if (!response.ok) {
    throw new Error(result?.message || "Gagal membuat pinjaman");
  }

  return result?.data as Loan;
};

/* -------------------- Custom Hook -------------------- */
export function useLoans() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

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

  // ✅ Hapus debounce, biarkan React Query handle request
  const { mutateAsync: createLoanMutation, isPending: isCreating } =
    useMutation({
      mutationFn: async (params: {
        users: InvitedUser[];
        items: LoanItem[];
        image?: File | null;
      }) => {
        if (!user) throw new Error("User not authenticated");

        const formData = new FormData();
        const borrowerIds = params.users.map((u) => u.borrower_id);
        formData.append("user", JSON.stringify(borrowerIds));
        formData.append("items", JSON.stringify(params.items));
        if (params.image) {
          formData.append("image", params.image);
        }

        console.log("📤 Sending loan request:", {
          users: params.users,
          items: params.items,
          hasImage: !!params.image,
        });

        const data = await createLoan(formData);
        return data;
      },
      onSuccess: (data) => {
        toast.success("Peminjaman berhasil dibuat!");
        queryClient.invalidateQueries({ queryKey: ["loans"] });
        console.log("✅ Loan created:", data);
      },
      onError: (err: Error) => {
        toast.error(err.message || "Gagal membuat peminjaman");
        console.error("❌ Failed to create loan:", err.message);
      },
    });

  return {
    loans,
    isLoading,
    isError,
    error,
    createLoan: createLoanMutation,
    isCreating,
  };
}
