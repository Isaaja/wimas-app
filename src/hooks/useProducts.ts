import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export interface Product {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  category_id: string;
  product_avaible: number;
  category?: {
    category_id: string;
    category_name: string;
  };
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductPayload {
  product_name: string;
  product_image: string;
  quantity: number;
  category_id: string;
  product_avaible: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface GetProductsParams {
  product_name?: string;
  sort?: string;
  order?: "asc" | "desc";
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
export const PRODUCT_QUERY_KEYS = {
  all: ["products"] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, "list"] as const,
  list: (params?: GetProductsParams) =>
    [...PRODUCT_QUERY_KEYS.lists(), ...(params ? [params] : [])] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
  categories: () => [...PRODUCT_QUERY_KEYS.all, "categories"] as const,
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
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
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

// ==================== OPTIMIZED API FUNCTIONS ====================
const fetchProducts = async (
  params?: GetProductsParams
): Promise<Product[]> => {
  const queryParams = new URLSearchParams();

  if (params?.product_name)
    queryParams.append("product_name", params.product_name);
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.order) queryParams.append("order", params.order);

  const queryString = queryParams.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ""}`;

  return fetchWithAuth(url);
};

const fetchProductById = async (id: string): Promise<Product> => {
  const data = await fetchWithAuth(`/api/products/${id}`);
  return data?.item || data;
};

const createProduct = async (
  payload: CreateProductPayload
): Promise<Product> => {
  const data = await fetchWithAuth("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.result || data;
};

const updateProduct = async ({
  id,
  payload,
}: {
  id: string;
  payload: Partial<Product>;
}): Promise<Product> => {
  const data = await fetchWithAuth(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data?.result || data;
};

const deleteProduct = async (id: string): Promise<string> => {
  const data = await fetchWithAuth(`/api/products/${id}`, {
    method: "DELETE",
  });
  return data?.message || "Produk berhasil dihapus";
};

// ==================== OPTIMIZED QUERY HOOKS ====================

export const useProducts = (params?: GetProductsParams) => {
  const queryKey = useMemo(() => PRODUCT_QUERY_KEYS.list(params), [params]);

  return useQuery({
    queryKey,
    queryFn: () => fetchProducts(params),
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.MEDIUM_TERM,
    retry: (failureCount, error) =>
      failureCount < 2 && !error.message.includes("Token"),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useProductById = (id: string) => {
  const queryKey = useMemo(() => PRODUCT_QUERY_KEYS.detail(id), [id]);

  return useQuery({
    queryKey,
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.LONG_TERM,
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
};

// ==================== OPTIMIZED MUTATION HOOKS ====================

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onMutate: async (newProduct: CreateProductPayload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });

      // Snapshot previous values
      const previousProducts = queryClient.getQueryData(
        PRODUCT_QUERY_KEYS.lists()
      );

      // Optimistically update to the new value
      const optimisticProduct: Product & { isOptimistic?: boolean } = {
        ...newProduct,
        product_id: `temp-${Date.now()}`,
        created_at: new Date(),
        updated_at: new Date(),
        isOptimistic: true,
      };

      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: Product[] = []) => [...old, optimisticProduct]
      );

      return { previousProducts };
    },
    onSuccess: (
      data: Product,
      variables: CreateProductPayload,
      context: any
    ) => {
      // Remove optimistic product and replace with real data
      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: (Product & { isOptimistic?: boolean })[] = []) =>
          old.filter((product) => !product.isOptimistic)
      );

      // PERBAIKAN: Gunakan setQueryData individual, bukan setQueriesData dengan computed properties
      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.detail(data.product_id),
        data
      );

      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: Product[] = []) => [...old, data]
      );

      // Smart invalidation untuk queries dengan params berbeda
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (error: Error, variables: CreateProductPayload, context: any) => {
      console.error("❌ Failed to create product:", error.message);

      // Rollback optimistic update
      if (context?.previousProducts) {
        queryClient.setQueryData(
          PRODUCT_QUERY_KEYS.lists(),
          context.previousProducts
        );
      }
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onMutate: async (variables: { id: string; payload: Partial<Product> }) => {
      await queryClient.cancelQueries({
        queryKey: PRODUCT_QUERY_KEYS.detail(variables.id),
      });
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });

      const previousProduct = queryClient.getQueryData(
        PRODUCT_QUERY_KEYS.detail(variables.id)
      );

      const previousProducts = queryClient.getQueryData(
        PRODUCT_QUERY_KEYS.lists()
      );

      // Optimistically update product detail
      if (previousProduct) {
        queryClient.setQueryData(
          PRODUCT_QUERY_KEYS.detail(variables.id),
          (old: Product) => ({ ...old, ...variables.payload })
        );
      }

      // Optimistically update products list
      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: Product[] = []) =>
          old.map((product) =>
            product.product_id === variables.id
              ? { ...product, ...variables.payload }
              : product
          )
      );

      return { previousProduct, previousProducts };
    },
    onSuccess: (
      updatedProduct: Product,
      variables: { id: string; payload: Partial<Product> }
    ) => {
      // Ensure cache is updated with server data
      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.detail(variables.id),
        updatedProduct
      );

      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: Product[] = []) =>
          old.map((product) =>
            product.product_id === variables.id ? updatedProduct : product
          )
      );

      // Invalidasi queries yang mungkin terpengaruh
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (
      error: Error,
      variables: { id: string; payload: Partial<Product> },
      context: any
    ) => {
      console.error("❌ Failed to update product:", error.message);

      // Rollback optimistic updates
      if (context?.previousProduct) {
        queryClient.setQueryData(
          PRODUCT_QUERY_KEYS.detail(variables.id),
          context.previousProduct
        );
      }

      if (context?.previousProducts) {
        queryClient.setQueryData(
          PRODUCT_QUERY_KEYS.lists(),
          context.previousProducts
        );
      }
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });

      const previousProducts = queryClient.getQueryData(
        PRODUCT_QUERY_KEYS.lists()
      );

      // Optimistically remove from list
      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: Product[] = []) =>
          old.filter((product) => product.product_id !== id)
      );

      return { previousProducts, deletedId: id };
    },
    onSuccess: (data: string, id: string, context: any) => {
      // Remove detail query
      queryClient.removeQueries({
        queryKey: PRODUCT_QUERY_KEYS.detail(context.deletedId),
      });

      // Invalidasi untuk memastikan data fresh
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (error: Error, id: string, context: any) => {
      console.error("❌ Failed to delete product:", error.message);

      // Rollback optimistic removal
      if (context?.previousProducts) {
        queryClient.setQueryData(
          PRODUCT_QUERY_KEYS.lists(),
          context.previousProducts
        );
      }
    },
  });
};

// ==================== OPTIMIZED SPECIALIZED HOOKS ====================

export const useProductSearch = (searchTerm: string) => {
  const { data: products, ...queryInfo } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!products || !searchTerm) return products || [];

    const term = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.product_name.toLowerCase().includes(term) ||
        (product.category?.category_name.toLowerCase().includes(term) ?? false)
    );
  }, [products, searchTerm]);

  return {
    products: filteredProducts,
    ...queryInfo,
  };
};

export const useAvailableProducts = () => {
  const { data: products, ...queryInfo } = useProducts();

  const availableProducts = useMemo(
    () => products?.filter((product) => product.product_avaible > 0) || [],
    [products]
  );

  return {
    products: availableProducts,
    ...queryInfo,
  };
};

export const useProductsByCategory = (categoryId?: string) => {
  const { data: products, ...queryInfo } = useProducts();

  const categorizedProducts = useMemo(() => {
    if (!products || !categoryId) return products || [];

    return products.filter((product) => product.category_id === categoryId);
  }, [products, categoryId]);

  return {
    products: categorizedProducts,
    ...queryInfo,
  };
};

// ==================== OPTIMIZED BATCH OPERATIONS ====================

export const useProductBatchOperations = () => {
  const queryClient = useQueryClient();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const updateMultipleProducts = useCallback(
    async (updates: Array<{ id: string; payload: Partial<Product> }>) => {
      const results = await Promise.allSettled(
        updates.map((update) => updateProductMutation.mutateAsync(update))
      );

      const successful = results.filter(
        (result): result is PromiseFulfilledResult<Product> =>
          result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );

      // Invalidasi cache setelah batch update
      if (successful.length > 0) {
        queryClient.invalidateQueries({
          queryKey: PRODUCT_QUERY_KEYS.lists(),
          refetchType: "active",
        });
      }

      return {
        successful: successful.map((s) => s.value),
        failed: failed.map((f) => f.reason),
      };
    },
    [updateProductMutation, queryClient]
  );

  const deleteMultipleProducts = useCallback(
    async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => deleteProductMutation.mutateAsync(id))
      );

      const successful = results.filter(
        (result): result is PromiseFulfilledResult<string> =>
          result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );

      if (successful.length > 0) {
        queryClient.invalidateQueries({
          queryKey: PRODUCT_QUERY_KEYS.lists(),
          refetchType: "active",
        });
      }

      return {
        successful: successful.map((s) => s.value),
        failed: failed.map((f) => f.reason),
      };
    },
    [deleteProductMutation, queryClient]
  );

  return {
    updateMultipleProducts,
    deleteMultipleProducts,
    isPending:
      updateProductMutation.isPending || deleteProductMutation.isPending,
  };
};
