"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export interface Category {
  category_id: string;
  category_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryPayload {
  category_name: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

// ==================== OPTIMIZED CACHE CONFIGURATION ====================
const CATEGORY_CACHE_CONFIG = {
  SHORT_TERM: 2 * 60 * 1000, // 2 minutes
  MEDIUM_TERM: 5 * 60 * 1000, // 5 minutes
  LONG_TERM: 10 * 60 * 1000, // 10 minutes

  STALE_SHORT: 30 * 1000, // 30 seconds
  STALE_MEDIUM: 2 * 60 * 1000, // 2 minutes
} as const;

// ==================== OPTIMIZED QUERY KEYS ====================
export const CATEGORY_QUERY_KEYS = {
  all: ["categories"] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, "list"] as const,
  list: (filters?: any) =>
    [...CATEGORY_QUERY_KEYS.lists(), ...(filters ? [filters] : [])] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
} as const;

// ==================== OPTIMIZED UTILITY FUNCTIONS ====================
const getAccessToken = (): string => {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("accessToken") ||
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1] ||
    ""
  );
};

// Centralized API client dengan error handling
const fetchWithAuth = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...(options.method === "GET" && { cache: "no-store" }),
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

  const result: ApiResponse<T> = await response.json();
  return result.data;
};

// ==================== OPTIMIZED API FUNCTIONS ====================
const fetchCategories = async (): Promise<Category[]> => {
  return fetchWithAuth<Category[]>("/api/category");
};

const fetchCategoryById = async (categoryId: string): Promise<Category> => {
  return fetchWithAuth<Category>(`/api/category/${categoryId}`);
};

const createCategory = async (payload: CategoryPayload): Promise<Category> => {
  return fetchWithAuth<Category>("/api/category", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

const updateCategory = async (
  id: string,
  payload: CategoryPayload
): Promise<Category> => {
  return fetchWithAuth<Category>(`/api/category/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

const deleteCategory = async (id: string): Promise<void> => {
  await fetchWithAuth<void>(`/api/category/${id}`, {
    method: "DELETE",
  });
};

// ==================== OPTIMIZED QUERY HOOKS ====================

export function useCategories() {
  const queryKey = useMemo(() => CATEGORY_QUERY_KEYS.list(), []);

  const { data, error, isLoading, refetch, isFetching } = useQuery<
    Category[],
    Error
  >({
    queryKey,
    queryFn: fetchCategories,
    staleTime: CATEGORY_CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CATEGORY_CACHE_CONFIG.MEDIUM_TERM,
    retry: (failureCount, error) =>
      failureCount < 2 && !error.message.includes("Token"),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: data || [],
    isLoading,
    isFetching,
    isError: !!error,
    error,
    refetch,
  };
}

export function useGetCategoryById(categoryId: string) {
  const queryKey = useMemo(
    () => CATEGORY_QUERY_KEYS.detail(categoryId),
    [categoryId]
  );

  return useQuery<Category, Error>({
    queryKey,
    queryFn: () => fetchCategoryById(categoryId),
    enabled: !!categoryId,
    staleTime: CATEGORY_CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CATEGORY_CACHE_CONFIG.LONG_TERM,
    retry: (failureCount, error) => {
      if (
        error.message.includes("tidak ditemukan") ||
        error.message.includes("not found")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// ==================== OPTIMIZED MUTATION HOOKS ====================

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, CategoryPayload>({
    mutationFn: createCategory,
    onMutate: async (newCategory: CategoryPayload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: CATEGORY_QUERY_KEYS.lists(),
      });

      // Snapshot previous values
      const previousCategories = queryClient.getQueryData(
        CATEGORY_QUERY_KEYS.lists()
      );

      // Optimistically update to the new value
      const optimisticCategory: Category & { isOptimistic?: boolean } = {
        ...newCategory,
        category_id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.lists(),
        (old: Category[] = []) => [...old, optimisticCategory]
      );

      return { previousCategories };
    },
    onSuccess: (data: Category, variables: CategoryPayload, context: any) => {
      // Remove optimistic category and replace with real data
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.lists(),
        (old: (Category & { isOptimistic?: boolean })[] = []) =>
          old.filter((category) => !category.isOptimistic)
      );

      // Update cache dengan data dari server
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.detail(data.category_id),
        data
      );
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.lists(),
        (old: Category[] = []) => [...old, data]
      );

      // Smart invalidation
      queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (error: Error, variables: CategoryPayload, context: any) => {
      console.error("Gagal membuat kategori:", error.message);

      // Rollback optimistic update
      if (context?.previousCategories) {
        queryClient.setQueryData(
          CATEGORY_QUERY_KEYS.lists(),
          context.previousCategories
        );
      }
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, { id: string; payload: CategoryPayload }>(
    {
      mutationFn: ({ id, payload }) => updateCategory(id, payload),
      onMutate: async (variables: { id: string; payload: CategoryPayload }) => {
        await queryClient.cancelQueries({
          queryKey: CATEGORY_QUERY_KEYS.detail(variables.id),
        });
        await queryClient.cancelQueries({
          queryKey: CATEGORY_QUERY_KEYS.lists(),
        });

        const previousCategory = queryClient.getQueryData(
          CATEGORY_QUERY_KEYS.detail(variables.id)
        );

        const previousCategories = queryClient.getQueryData(
          CATEGORY_QUERY_KEYS.lists()
        );

        // Optimistically update category detail
        if (previousCategory) {
          queryClient.setQueryData(
            CATEGORY_QUERY_KEYS.detail(variables.id),
            (old: Category) => ({
              ...old,
              ...variables.payload,
              updated_at: new Date().toISOString(),
            })
          );
        }

        // Optimistically update categories list
        queryClient.setQueryData(
          CATEGORY_QUERY_KEYS.lists(),
          (old: Category[] = []) =>
            old.map((category) =>
              category.category_id === variables.id
                ? {
                    ...category,
                    ...variables.payload,
                    updated_at: new Date().toISOString(),
                  }
                : category
            )
        );

        return { previousCategory, previousCategories };
      },
      onSuccess: (
        updatedCategory: Category,
        variables: { id: string; payload: CategoryPayload }
      ) => {
        // Ensure cache is updated with server data
        queryClient.setQueryData(
          CATEGORY_QUERY_KEYS.detail(variables.id),
          updatedCategory
        );

        queryClient.setQueryData(
          CATEGORY_QUERY_KEYS.lists(),
          (old: Category[] = []) =>
            old.map((category) =>
              category.category_id === variables.id ? updatedCategory : category
            )
        );

        // Invalidasi queries yang mungkin terpengaruh
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.lists(),
          refetchType: "inactive",
        });
      },
      onError: (
        error: Error,
        variables: { id: string; payload: CategoryPayload },
        context: any
      ) => {
        console.error("Gagal memperbarui kategori:", error.message);

        // Rollback optimistic updates
        if (context?.previousCategory) {
          queryClient.setQueryData(
            CATEGORY_QUERY_KEYS.detail(variables.id),
            context.previousCategory
          );
        }

        if (context?.previousCategories) {
          queryClient.setQueryData(
            CATEGORY_QUERY_KEYS.lists(),
            context.previousCategories
          );
        }
      },
    }
  );
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteCategory,
    onMutate: async (categoryId: string) => {
      await queryClient.cancelQueries({
        queryKey: CATEGORY_QUERY_KEYS.lists(),
      });

      const previousCategories = queryClient.getQueryData(
        CATEGORY_QUERY_KEYS.lists()
      );

      const previousCategory = queryClient.getQueryData(
        CATEGORY_QUERY_KEYS.detail(categoryId)
      );

      // Optimistically remove from list
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.lists(),
        (old: Category[] = []) =>
          old.filter((category) => category.category_id !== categoryId)
      );

      // Remove detail query
      queryClient.removeQueries({
        queryKey: CATEGORY_QUERY_KEYS.detail(categoryId),
      });

      return { previousCategories, previousCategory, deletedId: categoryId };
    },
    onSuccess: (data: void, categoryId: string, context: any) => {
      // Additional cleanup jika diperlukan
      queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (error: Error, categoryId: string, context: any) => {
      console.error("Gagal menghapus kategori:", error.message);

      // Rollback optimistic removal
      if (context?.previousCategories) {
        queryClient.setQueryData(
          CATEGORY_QUERY_KEYS.lists(),
          context.previousCategories
        );
      }

      // Restore detail query jika ada
      if (context?.previousCategory) {
        queryClient.setQueryData(
          CATEGORY_QUERY_KEYS.detail(categoryId),
          context.previousCategory
        );
      }
    },
  });
}

// ==================== OPTIMIZED SPECIALIZED HOOKS ====================

export function useCategorySearch(searchTerm: string) {
  const { data: categories, ...queryInfo } = useCategories();

  const filteredCategories = useMemo(() => {
    if (!categories || !searchTerm) return categories || [];

    const term = searchTerm.toLowerCase();
    return categories.filter((category) =>
      category.category_name.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  return {
    categories: filteredCategories,
    ...queryInfo,
  };
}

export function useCategoryOptions() {
  const { data: categories, ...queryInfo } = useCategories();

  const categoryOptions = useMemo(
    () =>
      categories?.map((category) => ({
        value: category.category_id,
        label: category.category_name,
      })) || [],
    [categories]
  );

  return {
    categoryOptions,
    ...queryInfo,
  };
}

// ==================== OPTIMIZED BATCH OPERATIONS ====================

export function useCategoryBatchOperations() {
  const queryClient = useQueryClient();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const updateMultipleCategories = useCallback(
    async (updates: Array<{ id: string; payload: CategoryPayload }>) => {
      const results = await Promise.allSettled(
        updates.map((update) => updateCategoryMutation.mutateAsync(update))
      );

      const successful = results.filter(
        (result): result is PromiseFulfilledResult<Category> =>
          result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );

      // Invalidasi cache setelah batch update
      if (successful.length > 0) {
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.lists(),
          refetchType: "active",
        });
      }

      return {
        successful: successful.map((s) => s.value),
        failed: failed.map((f) => f.reason),
      };
    },
    [updateCategoryMutation, queryClient]
  );

  const deleteMultipleCategories = useCallback(
    async (categoryIds: string[]) => {
      const results = await Promise.allSettled(
        categoryIds.map((categoryId) =>
          deleteCategoryMutation.mutateAsync(categoryId)
        )
      );

      const successful = results.filter(
        (result): result is PromiseFulfilledResult<void> =>
          result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );

      if (successful.length > 0) {
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.lists(),
          refetchType: "active",
        });
      }

      return {
        successful: successful.map((s) => s.value),
        failed: failed.map((f) => f.reason),
      };
    },
    [deleteCategoryMutation, queryClient]
  );

  return {
    updateMultipleCategories,
    deleteMultipleCategories,
    isPending:
      updateCategoryMutation.isPending || deleteCategoryMutation.isPending,
  };
}

// ==================== OPTIMIZED PRELOADING HOOKS ====================

export function usePreloadCategories() {
  const queryClient = useQueryClient();

  const preload = useMemo(
    () => ({
      all: () =>
        queryClient.prefetchQuery({
          queryKey: CATEGORY_QUERY_KEYS.list(),
          queryFn: fetchCategories,
          staleTime: CATEGORY_CACHE_CONFIG.STALE_MEDIUM,
        }),

      byId: (categoryId: string) =>
        queryClient.prefetchQuery({
          queryKey: CATEGORY_QUERY_KEYS.detail(categoryId),
          queryFn: () => fetchCategoryById(categoryId),
          staleTime: CATEGORY_CACHE_CONFIG.STALE_MEDIUM,
        }),
    }),
    [queryClient]
  );

  return preload;
}

// ==================== OPTIMIZED REFRESH HOOKS ====================

export function useRefreshCategories() {
  const queryClient = useQueryClient();

  const refresh = useMemo(
    () => ({
      all: () =>
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all }),

      list: () =>
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.lists(),
        }),

      detail: (categoryId: string) =>
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.detail(categoryId),
        }),
    }),
    [queryClient]
  );

  return refresh;
}
