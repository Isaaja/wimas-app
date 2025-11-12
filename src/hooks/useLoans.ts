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
  product_image?: string | null;
  loan_item_id?: string;
  unit_id?: string;
  serial_number?: string;
  unit_status?: string;
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

export interface Loan extends BaseLoan {}

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
  user: string[];
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

export interface DoneLoanParams {
  loanId: string;
  unitConditions: Record<string, string>;
}

// ==================== UNIT ASSIGNMENT INTERFACES ====================
export interface UnitAssignment {
  product_id: string;
  unit_ids: string[];
}

export interface ApproveLoanWithUnitsParams {
  loanId: string;
  units: UnitAssignment[];
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
  historyDetail: (id: string) => [...LOAN_QUERY_KEYS.history(), id] as const,
  check: () => [...LOAN_QUERY_KEYS.all, "check"] as const,
  userLoans: (userId: string) =>
    [...LOAN_QUERY_KEYS.all, "user", userId] as const,
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
    name: currentUser?.name || "Current User",
  },
  owner: {
    user_id: currentUser?.userId || "",
    username: currentUser?.username || "Current User",
    name: currentUser?.name || "Current User",
  },
  invited_users: params.user.map((userId) => ({
    user_id: userId,
    username: `user-${userId}`,
    name: `User ${userId}`,
  })),
  items: params.items.map((item) => ({
    ...item,
    product_name: "Loading...",
    product_image: null,
  })),
  isOptimistic: true,
});

// ==================== NEW UTILITY FUNCTIONS ====================

export const hasUnitAssignments = (loan: Loan): boolean => {
  return loan.items.some((item) => item.unit_id != null);
};

export const getProductQuantities = (loan: Loan): Record<string, number> => {
  if (loan.status === "REQUESTED") {
    return loan.items.reduce((acc: Record<string, number>, item) => {
      acc[item.product_id] = item.quantity;
      return acc;
    }, {});
  } else {
    return loan.items.reduce((acc: Record<string, number>, item) => {
      acc[item.product_id] = (acc[item.product_id] || 0) + 1;
      return acc;
    }, {});
  }
};

export const getUniqueProducts = (loan: Loan): LoanProduct[] => {
  if (loan.status === "REQUESTED") {
    return loan.items;
  } else {
    const productMap = new Map<string, LoanProduct>();
    loan.items.forEach((item) => {
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, {
          ...item,
          quantity: loan.items.filter((i) => i.product_id === item.product_id)
            .length,
        });
      }
    });
    return Array.from(productMap.values());
  }
};

export const getLoanItemsByStatus = (loan: Loan): LoanProduct[] => {
  if (loan.status === "REQUESTED") {
    return loan.items.map((item) => ({
      ...item,
      unit_id: undefined,
      serial_number: undefined,
      unit_status: undefined,
    }));
  } else {
    return loan.items;
  }
};

export const getAvailableUnitsCount = (
  items: LoanProduct[]
): Record<string, number> => {
  return items.reduce((acc: Record<string, number>, item) => {
    if (item.unit_id) {
      const productUnits = items.filter(
        (i) => i.product_id === item.product_id && i.unit_id
      );
      acc[item.product_id] = productUnits.length;
    } else {
      acc[item.product_id] = item.quantity;
    }
    return acc;
  }, {});
};

export const transformLoanItems = (
  loan: Loan
): {
  items: LoanProduct[];
  totalItems: number;
  productCount: number;
} => {
  const items = getLoanItemsByStatus(loan);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const productCount = new Set(items.map((item) => item.product_id)).size;

  return {
    items,
    totalItems,
    productCount,
  };
};

// ==================== OPTIMIZED API FUNCTIONS ====================
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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
  formData.append("user", JSON.stringify(params.user));
  formData.append("items", JSON.stringify(params.items));

  if (params.report) {
    formData.append("report", JSON.stringify(params.report));
  }

  if (params.docs) {
    formData.append("docs", params.docs);
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
    const errorText = await response.text();
    throw new Error(errorText || "Gagal membuat pinjaman");
  }

  const result = await response.json();
  return result.data;
};

const approveLoan = async (loanId: string): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/approve`, {
    method: "PATCH",
  });
};

const approveLoanWithUnits = async ({
  loanId,
  units,
}: ApproveLoanWithUnitsParams): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/approve`, {
    method: "POST",
    body: JSON.stringify({ unitAssignments: units }),
  });
};

const rejectLoan = async (loanId: string): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/reject`, {
    method: "PATCH",
  });
};

const deleteLoan = async (loanId: string): Promise<void> => {
  await fetchWithAuth(`/api/loan/${loanId}`, {
    method: "DELETE",
  });
};

const returnLoan = async (loanId: string): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/return`, {
    method: "POST",
  });
};

const doneLoan = async ({
  loanId,
  unitConditions,
}: DoneLoanParams): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/done`, {
    method: "POST",
    body: JSON.stringify({ unitConditions }),
  });
};

const fetchLoanHistory = async (): Promise<LoanHistoryResponse> => {
  return fetchWithAuth("/api/loan/history");
};

const fetchUserLoans = async (userId: string): Promise<Loan[]> => {
  return fetchWithAuth(`/api/loan/user/${userId}`);
};

const updateLoanItems = async ({
  loanId,
  items,
}: {
  loanId: string;
  items: LoanItem[];
}): Promise<Loan> => {
  return fetchWithAuth(`/api/loan/${loanId}/items`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
};

// ==================== OPTIMIZED QUERY HOOKS ====================

export function useLoans(filter?: "active" | "history" | "all") {
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
    refetchOnWindowFocus: false,
    select: useCallback(
      (data: Loan[]) => {
        if (!filter || filter === "all") return data;

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
          optimisticLoan as unknown as Loan,
          ...old,
        ]);

        return { previousLoans };
      },
      onSuccess: (data: Loan) => {
        toast.success("Peminjaman berhasil dibuat!");

        queryClient.setQueryData(queryKeys.lists, (old: Loan[] = []) => {
          const filtered = old.filter((loan) => !(loan as any).isOptimistic);
          return [data, ...filtered];
        });

        queryClient.setQueryData(LOAN_QUERY_KEYS.detail(data.loan_id), data);

        queryClient.invalidateQueries({ queryKey: queryKeys.check });
        queryClient.invalidateQueries({ queryKey: queryKeys.history });
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
    error: error as Error,
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

export function useUserLoans(userId: string) {
  const queryKey = useMemo(() => LOAN_QUERY_KEYS.userLoans(userId), [userId]);

  return useQuery({
    queryKey,
    queryFn: () => fetchUserLoans(userId),
    enabled: !!userId,
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.MEDIUM_TERM,
  });
}

// ==================== OPTIMIZED MUTATION HOOKS ====================

const createLoanMutationHook = (
  mutationFn: (loanId: string) => Promise<Loan>,
  successMessage: string,
  errorMessage: string
) => {
  return () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onMutate: async (loanId: string) => {
        await queryClient.cancelQueries({
          queryKey: LOAN_QUERY_KEYS.detail(loanId),
        });
        await queryClient.cancelQueries({ queryKey: LOAN_QUERY_KEYS.lists() });

        const previousLoan = queryClient.getQueryData(
          LOAN_QUERY_KEYS.detail(loanId)
        );
        const previousLoans = queryClient.getQueryData(LOAN_QUERY_KEYS.lists());

        const newStatus =
          mutationFn === approveLoan
            ? "APPROVED"
            : mutationFn === rejectLoan
            ? "REJECTED"
            : "RETURNED";

        queryClient.setQueryData(
          LOAN_QUERY_KEYS.detail(loanId),
          (old: Loan) => ({
            ...old,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
        );

        queryClient.setQueryData(LOAN_QUERY_KEYS.lists(), (old: Loan[] = []) =>
          old.map((loan) =>
            loan.loan_id === loanId
              ? {
                  ...loan,
                  status: newStatus,
                  updated_at: new Date().toISOString(),
                }
              : loan
          )
        );

        return { previousLoan, previousLoans };
      },
      onSuccess: (data: Loan) => {
        toast.success(successMessage);

        queryClient.setQueryData(LOAN_QUERY_KEYS.detail(data.loan_id), data);

        queryClient.setQueryData(LOAN_QUERY_KEYS.lists(), (old: Loan[] = []) =>
          old.map((loan) => (loan.loan_id === data.loan_id ? data : loan))
        );

        queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.history() });
        queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.check() });

        if (mutationFn === returnLoan) {
          queryClient.invalidateQueries({
            queryKey: [...LOAN_QUERY_KEYS.all, "products"],
          });
          queryClient.invalidateQueries({
            queryKey: [...LOAN_QUERY_KEYS.all, "units"],
          });
        }
      },
      onError: (err: Error, loanId: string, context: any) => {
        toast.error(err.message || errorMessage);

        if (context?.previousLoan) {
          queryClient.setQueryData(
            LOAN_QUERY_KEYS.detail(loanId),
            context.previousLoan
          );
        }
        if (context?.previousLoans) {
          queryClient.setQueryData(
            LOAN_QUERY_KEYS.lists(),
            context.previousLoans
          );
        }
      },
    });
  };
};

export const useDoneLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doneLoan,
    onMutate: async ({ loanId, unitConditions }: DoneLoanParams) => {
      await queryClient.cancelQueries({
        queryKey: LOAN_QUERY_KEYS.detail(loanId),
      });
      await queryClient.cancelQueries({ queryKey: LOAN_QUERY_KEYS.lists() });

      const previousLoan = queryClient.getQueryData(
        LOAN_QUERY_KEYS.detail(loanId)
      );
      const previousLoans = queryClient.getQueryData(LOAN_QUERY_KEYS.lists());

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.detail(loanId),
        (old: Loan | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: "DONE",
            updated_at: new Date().toISOString(),
          };
        }
      );

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.lists(),
        (old: Loan[] | undefined = []) =>
          old.map((loan) =>
            loan.loan_id === loanId
              ? {
                  ...loan,
                  status: "DONE",
                  updated_at: new Date().toISOString(),
                }
              : loan
          )
      );

      return { previousLoan, previousLoans, unitConditions };
    },
    onSuccess: (data: Loan, variables) => {
      queryClient.setQueryData(LOAN_QUERY_KEYS.detail(variables.loanId), data);

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.lists(),
        (old: Loan[] | undefined = []) =>
          old.map((loan) => (loan.loan_id === data.loan_id ? data : loan))
      );

      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.history() });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.check() });

      queryClient.invalidateQueries({
        queryKey: [...LOAN_QUERY_KEYS.all, "products"],
      });
      queryClient.invalidateQueries({
        queryKey: [...LOAN_QUERY_KEYS.all, "units"],
      });
    },
    onError: (err: Error, variables: DoneLoanParams, context: any) => {
      if (context?.previousLoan) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.detail(variables.loanId),
          context.previousLoan
        );
      }
      if (context?.previousLoans) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.lists(),
          context.previousLoans
        );
      }
    },
  });
};

export const useApproveLoan = createLoanMutationHook(
  approveLoan,
  "Peminjaman berhasil disetujui!",
  "Gagal menyetujui peminjaman"
);

export const useRejectLoan = createLoanMutationHook(
  rejectLoan,
  "Peminjaman berhasil ditolak!",
  "Gagal menolak peminjaman"
);

export const useReturnLoan = createLoanMutationHook(
  returnLoan,
  "Barang berhasil dikembalikan!",
  "Gagal mengembalikan barang"
);

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLoan,
    onMutate: async (loanId: string) => {
      await queryClient.cancelQueries({ queryKey: LOAN_QUERY_KEYS.lists() });

      const previousLoans = queryClient.getQueryData(LOAN_QUERY_KEYS.lists());

      queryClient.setQueryData(LOAN_QUERY_KEYS.lists(), (old: Loan[] = []) =>
        old.filter((loan) => loan.loan_id !== loanId)
      );

      return { previousLoans };
    },
    onSuccess: (_, loanId) => {
      queryClient.removeQueries({ queryKey: LOAN_QUERY_KEYS.detail(loanId) });

      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.history() });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.check() });
    },
    onError: (err: Error, loanId: string, context: any) => {
      if (context?.previousLoans) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.lists(),
          context.previousLoans
        );
      }
    },
  });
}

export function useUpdateLoanItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLoanItems,
    onMutate: async ({ loanId, items }) => {
      await queryClient.cancelQueries({
        queryKey: LOAN_QUERY_KEYS.detail(loanId),
      });
      await queryClient.cancelQueries({ queryKey: LOAN_QUERY_KEYS.lists() });

      const previousLoan = queryClient.getQueryData(
        LOAN_QUERY_KEYS.detail(loanId)
      );
      const previousLoans = queryClient.getQueryData(LOAN_QUERY_KEYS.lists());

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.detail(loanId),
        (old: Loan | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              product_name: old.items.find(
                (i: any) => i.product_id === item.product_id
              )?.product_name,
            })),
            updated_at: new Date().toISOString(),
          };
        }
      );

      return { previousLoan, previousLoans };
    },
    onSuccess: (data: Loan, variables) => {
      queryClient.setQueryData(LOAN_QUERY_KEYS.detail(variables.loanId), data);

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.lists(),
        (old: Loan[] | undefined = []) =>
          old.map((loan) => (loan.loan_id === data.loan_id ? data : loan))
      );

      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.history() });
    },
    onError: (err: Error, variables, context: any) => {
      if (context?.previousLoan) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.detail(variables.loanId),
          context.previousLoan
        );
      }
      if (context?.previousLoans) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.lists(),
          context.previousLoans
        );
      }
    },
  });
}

export function useApproveLoanWithUnits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveLoanWithUnits,
    onMutate: async ({ loanId }: ApproveLoanWithUnitsParams) => {
      await queryClient.cancelQueries({
        queryKey: LOAN_QUERY_KEYS.detail(loanId),
      });
      await queryClient.cancelQueries({ queryKey: LOAN_QUERY_KEYS.lists() });

      const previousLoan = queryClient.getQueryData(
        LOAN_QUERY_KEYS.detail(loanId)
      );
      const previousLoans = queryClient.getQueryData(LOAN_QUERY_KEYS.lists());

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.detail(loanId),
        (old: Loan | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: "APPROVED",
            updated_at: new Date().toISOString(),
          };
        }
      );

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.lists(),
        (old: Loan[] | undefined = []) =>
          old.map((loan) =>
            loan.loan_id === loanId
              ? {
                  ...loan,
                  status: "APPROVED",
                  updated_at: new Date().toISOString(),
                }
              : loan
          )
      );

      return { previousLoan, previousLoans };
    },
    onSuccess: (data: Loan, variables) => {
      queryClient.setQueryData(LOAN_QUERY_KEYS.detail(variables.loanId), data);

      queryClient.setQueryData(
        LOAN_QUERY_KEYS.lists(),
        (old: Loan[] | undefined = []) =>
          old.map((loan) => (loan.loan_id === data.loan_id ? data : loan))
      );

      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.history() });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.check() });
      queryClient.invalidateQueries({
        queryKey: [...LOAN_QUERY_KEYS.all, "products"],
      });
      queryClient.invalidateQueries({
        queryKey: [...LOAN_QUERY_KEYS.all, "units"],
      });
    },
    onError: (
      err: Error,
      variables: ApproveLoanWithUnitsParams,
      context: any
    ) => {
      if (context?.previousLoan) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.detail(variables.loanId),
          context.previousLoan
        );
      }
      if (context?.previousLoans) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.lists(),
          context.previousLoans
        );
      }
    },
  });
}

// ==================== OPTIMIZED HISTORY HOOKS ====================

export function useLoanHistory() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: LOAN_QUERY_KEYS.history(),
    queryFn: fetchLoanHistory,
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.LONG_TERM,
    enabled: !!user,
    retry: 2,
  });
}

export function useFilteredLoanHistory(
  filter?: "active" | "completed" | "all"
) {
  const { data, isLoading, isError, error } = useLoanHistory();

  const filteredData = useMemo(() => {
    if (!data?.loans) return { loans: [], total: 0 };

    let filteredLoans = data.loans;

    if (filter && filter !== "all") {
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
    error: error as Error,
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
    error: error as Error,
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
    error: error as Error,
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

// ==================== COMPOSED HOOKS ====================

export function useLoanStats() {
  const { loans, isLoading: loansLoading } = useLoans("all");
  const { data: historyData, isLoading: historyLoading } = useLoanHistory();

  const stats = useMemo(() => {
    const activeLoans = loans.filter(
      (loan) => loan.status === "REQUESTED" || loan.status === "APPROVED"
    ).length;

    const pendingApproval = loans.filter(
      (loan) => loan.status === "REQUESTED"
    ).length;

    const totalHistory = historyData?.total || 0;

    return {
      activeLoans,
      pendingApproval,
      totalHistory,
      totalLoans: loans.length,
    };
  }, [loans, historyData]);

  return {
    stats,
    isLoading: loansLoading || historyLoading,
  };
}

export function useRealtimeLoans(interval: number = 30000) {
  const { loans, isLoading, refetch } = useLoans("all");

  useQuery({
    queryKey: [...LOAN_QUERY_KEYS.lists(), "realtime"],
    queryFn: () => fetchLoans(),
    refetchInterval: interval,
    refetchIntervalInBackground: true,
    enabled: !isLoading,
  });

  return {
    loans,
    isLoading,
    refetch,
  };
}

export const getProductUnits = (loan: Loan, productId: string): any[] => {
  if (!loan.items) return [];

  const productItems = loan.items.filter(
    (item) => item.product_id === productId
  );

  const itemsWithUnits = productItems.filter((item) => item.unit_id);

  if (itemsWithUnits.length > 0) {
    return itemsWithUnits.map((item) => ({
      unit_id: item.unit_id,
      serial_number: item.serial_number || `Unit-${item.unit_id?.slice(-4)}`,
      unit_status: item.unit_status || "ASSIGNED",
    }));
  }

  const quantity = getProductQuantities(loan)[productId] || 0;
  return Array.from({ length: quantity }, (_, index) => ({
    unit_id: `unit-${productId}-${index + 1}`,
    serial_number: `SN-${productId.slice(-4)}-${index + 1}`,
    unit_status: "PENDING",
  }));
};

export const productHasUnits = (loan: Loan, productId: string): boolean => {
  if (!loan.items) return false;
  return loan.items.some(
    (item) => item.product_id === productId && item.unit_id
  );
};

export default {
  useLoans,
  useLoanById,
  useUserLoans,
  useApproveLoan,
  useApproveLoanWithUnits,
  useRejectLoan,
  useReturnLoan,
  useDoneLoan,
  useDeleteLoan,
  useUpdateLoanItems,
  useLoanHistory,
  useFilteredLoanHistory,
  useLoanHistoryById,
  useLoanHistoryByRole,
  useCheckUserLoan,
  useLoanStats,
  useRealtimeLoans,
  hasUnitAssignments,
  getProductQuantities,
  getUniqueProducts,
  getLoanItemsByStatus,
};
