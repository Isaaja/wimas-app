"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { toast } from "react-toastify";
import { useCallback, useMemo } from "react";

// ==================== OPTIMIZED INTERFACES ====================
export interface LoanItem {
  product_id: string;
  quantity: number;
}

export interface LoanProduct extends LoanItem {
  product_name: string;
  loan_item_id?: string;
}

export interface LoanUser {
  user_id: string;
  name?: string;
  username: string;
}

export interface LoanReport {
  report_id: string;
  spt_file: string | null;
  spt_number: string;
  destination: string;
  place_of_execution: string;
  start_date: string;
  end_date: string;
}

// Base Loan interface
export interface BaseLoan {
  loan_id: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RETURNED" | "DONE";
  created_at: string;
  updated_at: string;
  borrower: LoanUser;
  owner: LoanUser;
  invited_users: LoanUser[];
  items: LoanProduct[];
  report?: LoanReport;
}

// Extended Loan interface for API responses
export interface Loan extends BaseLoan {}

// Interface untuk optimistic update
export interface OptimisticLoan extends Omit<BaseLoan, "items"> {
  items: LoanItem[];
  isOptimistic?: boolean;
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

export interface CreateLoanParams {
  users: string[];
  items: LoanItem[];
  docs?: File | null;
  report?: Omit<LoanReport, "report_id" | "spt_file">;
}

// ==================== LOAN HISTORY INTERFACES ====================
export interface LoanHistoryProduct {
  product_id: string;
  product_name: string;
  quantity: number;
  product_image: string;
}

export interface LoanHistoryUser {
  user_id: string;
  username: string;
  name: string;
}

export interface LoanHistoryParticipant {
  id: string;
  loan_id: string;
  user_id: string;
  created_at: string;
  role: "OWNER" | "INVITED";
  user: LoanHistoryUser;
}

export interface LoanHistoryReport {
  report_id: string;
  loan_id: string;
  spt_file: string | null;
  spt_number: string;
  destination: string;
  place_of_execution: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface LoanHistory {
  loan_id: string;
  borrower_id: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RETURNED" | "DONE";
  spt_file?: string | null;
  created_at: string;
  updated_at: string;
  borrower: LoanHistoryUser;
  items: LoanHistoryProduct[];
  participants: LoanHistoryParticipant[];
  userRole: "OWNER" | "INVITED";
  participantId: string;
  report?: LoanHistoryReport;
}

export interface LoanHistoryResponse {
  loans: LoanHistory[];
  total: number;
}

export interface ReturnLoanResponse {
  status: string;
  data: Loan;
  message?: string;
}

export interface DoneLoanResponse {
  status: string;
  data: Loan;
  message?: string;
}

// ==================== OPTIMIZED CACHE CONFIGURATION ====================
const CACHE_CONFIG = {
  SHORT_TERM: 2 * 60 * 1000,
  MEDIUM_TERM: 5 * 60 * 1000,
  LONG_TERM: 10 * 60 * 1000,

  STALE_SHORT: 30 * 1000,
  STALE_MEDIUM: 2 * 60 * 1000,
} as const;

// ==================== OPTIMIZED QUERY KEYS ====================
export const LOAN_QUERY_KEYS = {
  all: ["loans"] as const,
  lists: () => [...LOAN_QUERY_KEYS.all, "list"] as const,
  list: (filter?: string) => [...LOAN_QUERY_KEYS.lists(), { filter }] as const,
  details: () => [...LOAN_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...LOAN_QUERY_KEYS.details(), id] as const,
  history: () => [...LOAN_QUERY_KEYS.all, "history"] as const,
  check: () => [...LOAN_QUERY_KEYS.all, "check"] as const,
} as const;

// ==================== UTILITY FUNCTIONS ====================
const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("accessToken") ||
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1] ||
    null
  );
};

// Helper untuk create optimistic loan data
const createOptimisticLoan = (
  params: CreateLoanParams,
  currentUser: any
): OptimisticLoan => ({
  loan_id: `temp-${Date.now()}`,
  status: "REQUESTED",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  borrower: {
    user_id: currentUser?.userId || "",
    username: currentUser?.username || "Current User",
  },
  owner: {
    user_id: currentUser?.userId || "",
    username: currentUser?.username || "Current User",
  },
  invited_users: params.users.map((userId) => ({
    user_id: userId,
    username: `user-${userId}`,
  })),
  items: params.items,
  isOptimistic: true,
});

// ==================== OPTIMIZED API FUNCTIONS ====================
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Terjadi kesalahan pada server";

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson?.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result?.data ?? result;
};

const fetchLoans = async (): Promise<Loan[]> => {
  return fetchWithAuth("/api/loan");
};

const fetchLoanById = async (loanId: string): Promise<Loan> => {
  const data = await fetchWithAuth(`/api/loan/${loanId}`);

  if (Array.isArray(data)) {
    const filtered = data.filter((loan: Loan) => loan.status !== "RETURNED");
    if (filtered.length === 0) {
      throw new Error("Loan not found or already returned");
    }
    return filtered[0];
  }
  return data;
};

const checkUserLoan = async (): Promise<CheckUserLoanResponse> => {
  return fetchWithAuth("/api/loan/check");
};

const createLoan = async (params: CreateLoanParams): Promise<Loan> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const formData = new FormData();
  formData.append("user", JSON.stringify(params.users));
  formData.append("items", JSON.stringify(params.items));

  if (params.report) {
    formData.append("report", JSON.stringify(params.report));
  }

  if (params.docs) {
    formData.append("docs", params.docs);
  }

  const response = await fetch("/api/loan", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal membuat pinjaman");
  }

  return response.json();
};

const approveLoan = async (loanId: string): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
};

const rejectLoan = async (loanId: string): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
};

const deleteLoan = async (loanId: string): Promise<void> => {
  await fetchWithAuth(`/api/loan/${loanId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
};

const returnLoan = async (loanId: string): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
};

const doneLoan = async (loanId: string): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/done`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
};

const fetchLoanHistory = async (): Promise<LoanHistoryResponse> => {
  return fetchWithAuth("/api/loan/history");
};

// ==================== OPTIMIZED QUERY HOOKS ====================

export function useLoans(filter?: "active" | "history") {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const queryKeys = useMemo(
    () => ({
      lists: LOAN_QUERY_KEYS.lists(),
      specificList: LOAN_QUERY_KEYS.list(filter),
      check: LOAN_QUERY_KEYS.check(),
      history: LOAN_QUERY_KEYS.history(),
    }),
    [filter]
  );

  const {
    data: loans = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.specificList,
    queryFn: fetchLoans,
    staleTime: CACHE_CONFIG.STALE_SHORT, 
    gcTime: CACHE_CONFIG.MEDIUM_TERM,
    retry: (failureCount, error) =>
      failureCount < 2 && !error.message.includes("Token"),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, 
    refetchIntervalInBackground: false,
    select: useCallback(
      (data: Loan[]) => {
        if (!filter) return data;

        const filterMap: Record<"active" | "history", Loan["status"][]> = {
          active: ["REQUESTED", "APPROVED", "RETURNED"],
          history: ["REJECTED", "DONE"],
        };

        return filter in filterMap
          ? data.filter((loan) => filterMap[filter].includes(loan.status))
          : data;
      },
      [filter]
    ),
  });

  const { mutateAsync: createLoanMutation, isPending: isCreating } =
    useMutation({
      mutationFn: createLoan,
      onMutate: async (newLoan: CreateLoanParams) => {
        if (!user) throw new Error("User not authenticated");

        await queryClient.cancelQueries({ queryKey: queryKeys.lists });

        const previousLoans = queryClient.getQueryData(queryKeys.lists);

        const optimisticLoan = createOptimisticLoan(newLoan, user);

        queryClient.setQueryData(queryKeys.lists, (old: Loan[] = []) => [
          ...old,
          optimisticLoan as unknown as Loan,
        ]);

        return { previousLoans };
      },
      onSuccess: (data: Loan, variables: CreateLoanParams, context: any) => {
        toast.success("Peminjaman berhasil dibuat!");

        queryClient.setQueryData(queryKeys.lists, (old: Loan[] = []) =>
          old.filter((loan) => !(loan as any).isOptimistic)
        );

        queryClient.setQueryData(LOAN_QUERY_KEYS.detail(data.loan_id), data);
        queryClient.setQueryData(queryKeys.lists, (old: Loan[] = []) => [
          ...old,
          data,
        ]);

        const queriesToInvalidate = [queryKeys.check, queryKeys.history];
        queriesToInvalidate.forEach((queryKey) => {
          queryClient.invalidateQueries({
            queryKey,
            exact: true,
            refetchType: "active",
          });
        });
      },
      onError: (err: Error, variables: CreateLoanParams, context: any) => {
        toast.error(err.message || "Gagal membuat peminjaman");

        if (context?.previousLoans) {
          queryClient.setQueryData(queryKeys.lists, context.previousLoans);
        }
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

export function useLoanById(loanId: string) {
  const queryKey = useMemo(() => LOAN_QUERY_KEYS.detail(loanId), [loanId]);

  return useQuery({
    queryKey,
    queryFn: () => fetchLoanById(loanId),
    enabled: !!loanId,
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.LONG_TERM,
    retry: (failureCount, error) => {
      if (
        error.message.includes("not found") ||
        error.message.includes("returned")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// ==================== OPTIMIZED MUTATION HOOKS ====================

const createLoanMutationHook = (
  mutationFn: (loanId: string) => Promise<Loan>,
  successMessage: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data: Loan) => {
      toast.success(successMessage);

      queryClient.setQueryData(LOAN_QUERY_KEYS.detail(data.loan_id), data);

      const queriesToInvalidate = [
        LOAN_QUERY_KEYS.lists(),
        LOAN_QUERY_KEYS.history(),
      ];

      queriesToInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({
          queryKey,
          exact: true,
          refetchType: "active",
        });
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || `Gagal: ${successMessage}`);
    },
  });
};

export const useApproveLoan = () =>
  createLoanMutationHook(approveLoan, "Peminjaman berhasil disetujui!");

export const useRejectLoan = () =>
  createLoanMutationHook(rejectLoan, "Peminjaman berhasil ditolak!");

export const useReturnLoan = () =>
  createLoanMutationHook(returnLoan, "Barang berhasil dikembalikan!");

export const useDoneLoan = () =>
  createLoanMutationHook(doneLoan, "Peminjaman berhasil diselesaikan!");

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLoan,
    onSuccess: (_, loanId) => {
      toast.success("Peminjaman berhasil dihapus!");
      queryClient.removeQueries({ queryKey: LOAN_QUERY_KEYS.detail(loanId) });
      queryClient.invalidateQueries({
        queryKey: LOAN_QUERY_KEYS.lists(),
        refetchType: "active",
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus peminjaman");
    },
  });
}

export const useUpdateLoanItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loanId,
      items,
    }: {
      loanId: string;
      items: LoanItem[];
    }) => {
      return fetchWithAuth(`/api/loan/${loanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: (data: Loan, variables) => {
      queryClient.setQueryData(LOAN_QUERY_KEYS.detail(variables.loanId), data);
      queryClient.invalidateQueries({
        queryKey: LOAN_QUERY_KEYS.lists(),
        refetchType: "active",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui item peminjaman");
    },
  });
};

// ==================== OPTIMIZED HISTORY HOOKS ====================

export function useLoanHistory() {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.history(),
    queryFn: fetchLoanHistory,
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.LONG_TERM,
    retry: 2,
  });
}

export function useFilteredLoanHistory(filter?: "active" | "completed") {
  const { data, isLoading, isError, error } = useLoanHistory();

  const filteredData = useMemo(() => {
    if (!data?.loans) return { loans: [], total: 0 };
    let filteredLoans = data.loans;

    if (filter) {
      switch (filter) {
        case "active":
          filteredLoans = data.loans.filter(
            (loan) =>
              loan.status === "REQUESTED" ||
              loan.status === "APPROVED" ||
              loan.status === "RETURNED"
          );
          break;
        case "completed":
          filteredLoans = data.loans.filter(
            (loan) => loan.status === "REJECTED" || loan.status === "DONE"
          );
          break;
        default:
          filteredLoans = data.loans;
      }
    }

    return {
      loans: filteredLoans,
      total: filteredLoans.length,
    };
  }, [data, filter]);

  return {
    ...filteredData,
    isLoading,
    isError,
    error,
    originalData: data,
  };
}

export function useLoanHistoryById(loanId: string) {
  const queryClient = useQueryClient();

  const cachedLoan = useMemo(
    () =>
      queryClient
        .getQueryData<LoanHistoryResponse>(LOAN_QUERY_KEYS.history())
        ?.loans.find((loan) => loan.loan_id === loanId),
    [queryClient, loanId]
  );

  const { data, isLoading, isError, error } = useLoanHistory();

  const loan =
    cachedLoan || data?.loans.find((loan) => loan.loan_id === loanId);

  return {
    loan,
    isLoading: cachedLoan ? false : isLoading,
    isError,
    error,
  };
}

export function useLoanHistoryByRole(role?: "OWNER" | "INVITED") {
  const { data, isLoading, isError, error } = useLoanHistory();

  const loansByRole = useMemo(
    () =>
      role ? data?.loans.filter((loan) => loan.userRole === role) : data?.loans,
    [data, role]
  );

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
    queryKey: LOAN_QUERY_KEYS.check(),
    queryFn: checkUserLoan,
    enabled: !!user?.userId,
    staleTime: CACHE_CONFIG.STALE_SHORT,
    gcTime: CACHE_CONFIG.SHORT_TERM,
    retry: 1,
  });
}
