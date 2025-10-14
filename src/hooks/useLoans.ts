"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { toast } from "react-toastify";

export interface LoanProduct {
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface LoanUser {
  user_id: string;
  name: string;
  username: string;
}

export interface Loan {
  loan_id: string;
  borrower_id: string;
  borrower_name: string;
  borrower_username: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RETURNED";
  spt_file: string | null;
  created_at: string;
  updated_at: string;
  owner: LoanUser;
  invited_users: LoanUser[];
  products: LoanProduct[];
}

export interface LoanItem {
  product_id: string;
  quantity: number;
}

export interface CheckUserLoanResponse {
  canBorrow: boolean;
  reason: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// ==================== LOAN HISTORY INTERFACES ====================
export interface LoanHistoryProduct {
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface LoanHistoryUser {
  user_id: string;
  name: string;
  username: string;
}

export interface LoanHistoryParticipant {
  user: LoanHistoryUser;
  role: string;
}

export interface LoanHistory {
  loan_id: string;
  borrower_id: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RETURNED";
  spt_file: string | null;
  created_at: string;
  updated_at: string;
  borrower: LoanHistoryUser;
  items: LoanHistoryProduct[];
  participants: LoanHistoryParticipant[];
  userRole: string;
  participantId: string;
}

export interface LoanHistoryResponse {
  loans: LoanHistory[];
  total: number;
}
// ==================== END LOAN HISTORY INTERFACES ====================

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

//kecuali return
const fetchLoanById = async (loanId: string): Promise<Loan> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(`/api/loan/${loanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal memuat detail peminjaman");

  if (Array.isArray(result?.data)) {
    const filtered = result.data.filter((loan: Loan) => loan.status !== "RETURNED");
    if (filtered.length === 0) {
      throw new Error("Loan not found or already returned");
    }
    return filtered[0];
  }
  return result?.data as Loan;
};

const checkUserLoan = async (): Promise<CheckUserLoanResponse> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch("/api/loan/check", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal memeriksa status peminjaman");

  return result?.data;
};

const createLoan = async (formData: FormData): Promise<Loan> => {
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

const approveLoan = async (loanId: string): Promise<Loan> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(`/api/loan/${loanId}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal menyetujui peminjaman");

  return result?.data;
};

const rejectLoan = async (loanId: string): Promise<Loan> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(`/api/loan/${loanId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal menolak peminjaman");

  return result?.data;
};

const returnLoan = async (loanId: string): Promise<Loan> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(`/api/loan/${loanId}/return`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal mengembalikan peminjaman");

  return result?.data;
};

const deleteLoan = async (loanId: string): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(`/api/loan/${loanId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal menghapus peminjaman");
};

// ==================== LOAN HISTORY FUNCTIONS ====================
const fetchLoanHistory = async (): Promise<LoanHistoryResponse> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch("/api/loan/history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.message || "Gagal memuat riwayat peminjaman");
  }

  return result?.data as LoanHistoryResponse;
};
// ==================== END LOAN HISTORY FUNCTIONS ====================

/* -------------------- Custom Hooks -------------------- */

export function useLoans(filter?: "active" | "history") {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const {
    data: loans = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loans", filter],
    queryFn: fetchLoans,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    select: (data) => {
      if (!filter) return data;

      if (filter === "active") {
        // tampilkan hanya REQUESTED & APPROVED
        return data.filter(
          (loan) => loan.status === "REQUESTED" || loan.status === "APPROVED"
        );
      }

      if (filter === "history") {
        // tampilkan hanya REJECTED & RETURNED
        return data.filter(
          (loan) => loan.status === "REJECTED" || loan.status === "RETURNED"
        );
      }

      return data;
    },
  });

  const { mutateAsync: createLoanMutation, isPending: isCreating } =
    useMutation({
      mutationFn: async (params: {
        users: string[]; // Array of user IDs
        items: LoanItem[];
        docs?: File | null;
      }) => {
        if (!user) throw new Error("User not authenticated");

        const formData = new FormData();
        formData.append("user", JSON.stringify(params.users));
        formData.append("items", JSON.stringify(params.items));
        if (params.docs) {
          formData.append("docs", params.docs);
        }

        console.log("📤 Sending loan request:", {
          users: params.users,
          items: params.items,
          hasDocs: !!params.docs,
        });

        const data = await createLoan(formData);
        return data;
      },
      onSuccess: (data) => {
        toast.success("Peminjaman berhasil dibuat!");
        queryClient.invalidateQueries({ queryKey: ["loans"] });
        queryClient.invalidateQueries({ queryKey: ["loans", "check"] });
        queryClient.invalidateQueries({ queryKey: ["loanHistory"] }); // Invalidate history too
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
    refetch,
    createLoan: createLoanMutation,
    isCreating,
  };
}

/**
 * Hook untuk mendapatkan detail peminjaman berdasarkan ID
 */
export function useLoanById(loanId: string) {
  return useQuery({
    queryKey: ["loans", loanId],
    queryFn: () => fetchLoanById(loanId),
    enabled: !!loanId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
/**
 * Hook untuk approve peminjaman
 */
export function useApproveLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveLoan,
    onSuccess: (data) => {
      toast.success("Peminjaman berhasil disetujui!");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loans", data.loan_id] });
      queryClient.invalidateQueries({ queryKey: ["loanHistory"] }); // Invalidate history too
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyetujui peminjaman");
      console.error("❌ Failed to approve loan:", err.message);
    },
  });
}

/**
 * Hook untuk reject peminjaman
 */
export function useRejectLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectLoan,
    onSuccess: (data) => {
      toast.success("Peminjaman berhasil ditolak!");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loans", data.loan_id] });
      queryClient.invalidateQueries({ queryKey: ["loanHistory"] }); // Invalidate history too
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menolak peminjaman");
      console.error("❌ Failed to reject loan:", err.message);
    },
  });
}

/**
 * Hook untuk return/mengembalikan peminjaman
 */
export function useReturnLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: returnLoan,
    onSuccess: (data) => {
      toast.success("Peminjaman berhasil dikembalikan!");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loans", data.loan_id] });
      queryClient.invalidateQueries({ queryKey: ["loanHistory"] }); // Invalidate history too
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal mengembalikan peminjaman");
      console.error("❌ Failed to return loan:", err.message);
    },
  });
}

/**
 * Hook untuk delete peminjaman
 */
export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLoan,
    onSuccess: () => {
      toast.success("Peminjaman berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanHistory"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus peminjaman");
      console.error("❌ Failed to delete loan:", err.message);
    },
  });
}

export function useLoanHistory() {
  return useQuery({
    queryKey: ["loanHistory"],
    queryFn: fetchLoanHistory,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFilteredLoanHistory(filter?: "active" | "completed") {
  const { data, isLoading, isError, error } = useLoanHistory();

  const filteredLoans = data?.loans.filter((loan) => {
    if (!filter) return true;

    if (filter === "active") {
      return loan.status === "REQUESTED" || loan.status === "APPROVED";
    }

    if (filter === "completed") {
      return loan.status === "REJECTED" || loan.status === "RETURNED";
    }

    return true;
  });

  return {
    loans: filteredLoans || [],
    total: filteredLoans?.length || 0,
    isLoading,
    isError,
    error,
    originalData: data,
  };
}

export function useLoanHistoryById(loanId: string) {
  const { data, isLoading, isError, error } = useLoanHistory();

  const loan = data?.loans.find((loan) => loan.loan_id === loanId);

  return {
    loan,
    isLoading,
    isError,
    error,
  };
}

export function useLoanHistoryByRole(role?: "OWNER" | "INVITED") {
  const { data, isLoading, isError, error } = useLoanHistory();

  const loansByRole = role
    ? data?.loans.filter((loan) => loan.userRole === role)
    : data?.loans;

  return {
    loans: loansByRole || [],
    total: loansByRole?.length || 0,
    isLoading,
    isError,
    error,
  };
}

export function useCheckUserLoan() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["loans", "check", user?.userId],
    queryFn: checkUserLoan,
    enabled: !!user?.userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
