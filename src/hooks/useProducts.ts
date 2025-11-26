import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export interface Product {
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  category_id: string;
  product_available: number;
  category?: {
    category_id: string;
    category_name: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  units?: {
    serialNumber: string;
    status?: string;
    condition?: string;
    note?: string;
    unit_id?: string;
    product_id?: string;
  }[];
}

export interface CreateProductPayload {
  product_name: string;
  product_image: string;
  quantity: number;
  category_id: string;
  product_available: number;
  units: { serialNumber: string }[];
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

// ==================== PRODUCT UNIT INTERFACES ====================
export interface ProductUnit {
  unit_id: string;
  serialNumber: string;
  status: string;
  product_id: string;
  createdAt: string;
}

export interface GetProductUnitsParams {
  productId: string;
  status?: string;
}

interface RepairUnitPayload {
  product_id: string;
  unit_id: string;
  condition: "GOOD" | "DAMAGED";
  note?: string;
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
  units: () => [...PRODUCT_QUERY_KEYS.all, "units"] as const,
  productUnits: (productId: string, status?: string) =>
    [
      ...PRODUCT_QUERY_KEYS.units(),
      productId,
      ...(status ? [status] : []),
    ] as const,
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
  const result = await fetchWithAuth(`/api/products/${id}`);
  return result;
};

const createProduct = async (
  payload: CreateProductPayload
): Promise<Product> => {
  const result = await fetchWithAuth("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return result;
};

const updateProduct = async ({
  id,
  payload,
}: {
  id: string;
  payload: Partial<Product>;
}): Promise<Product> => {
  const result = await fetchWithAuth(`/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return result;
};

const deleteProduct = async (id: string): Promise<string> => {
  const result = await fetchWithAuth(`/api/products/${id}`, {
    method: "DELETE",
  });

  return result?.message || "Produk berhasil dihapus";
};

// ==================== PRODUCT UNITS API FUNCTIONS ====================

const fetchProductUnits = async ({
  productId,
  status,
}: GetProductUnitsParams): Promise<ProductUnit[]> => {
  const queryParams = new URLSearchParams();

  if (status) {
    queryParams.append("status", status);
  }

  const queryString = queryParams.toString();
  const url = `/api/products/${productId}/units${
    queryString ? `?${queryString}` : ""
  }`;

  return fetchWithAuth(url);
};

const fetchAvailableProductUnits = async (
  productId: string
): Promise<ProductUnit[]> => {
  return fetchProductUnits({ productId, status: "AVAILABLE" });
};

// ==================== PRODUCT UNITS QUERY HOOKS ====================

export const useProductUnits = ({
  productId,
  status,
}: GetProductUnitsParams) => {
  const queryKey = useMemo(
    () => PRODUCT_QUERY_KEYS.productUnits(productId, status),
    [productId, status]
  );

  return useQuery({
    queryKey,
    queryFn: () => fetchProductUnits({ productId, status }),
    enabled: !!productId,
    staleTime: CACHE_CONFIG.STALE_SHORT,
    gcTime: CACHE_CONFIG.SHORT_TERM,
    retry: (failureCount, error) => {
      if (
        error.message.includes("tidak ditemukan") ||
        error.message.includes("not found") ||
        error.message.includes("required")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useAvailableProductUnits = (productId: string) => {
  return useProductUnits({ productId, status: "AVAILABLE" });
};

export const useLoanedProductUnits = (productId: string) => {
  return useProductUnits({ productId, status: "LOANED" });
};

export const useAllProductUnits = (productId: string) => {
  return useProductUnits({ productId });
};

// ==================== PRODUCT UNITS MUTATION HOOKS ====================

export const useUpdateUnitStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      unitId,
      status,
      productId,
    }: {
      unitId: string;
      status: string;
      productId: string;
    }) => {
      return fetchWithAuth(`/api/units/${unitId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: PRODUCT_QUERY_KEYS.productUnits(variables.productId),
      });

      const previousUnits = queryClient.getQueryData(
        PRODUCT_QUERY_KEYS.productUnits(variables.productId)
      );

      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.productUnits(variables.productId),
        (old: ProductUnit[] = []) =>
          old.map((unit) =>
            unit.unit_id === variables.unitId
              ? { ...unit, status: variables.status }
              : unit
          )
      );

      return { previousUnits };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.productUnits(variables.productId),
      });

      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.detail(variables.productId),
      });
    },
    onError: (error, variables, context) => {
      console.error("❌ Failed to update unit status:", error.message);

      if (context?.previousUnits) {
        queryClient.setQueryData(
          PRODUCT_QUERY_KEYS.productUnits(variables.productId),
          context.previousUnits
        );
      }
    },
  });
};

// ==================== SPECIALIZED PRODUCT UNITS HOOKS ====================

/**
 * Hook untuk select units dalam loan approval process
 */
export const useUnitSelection = (productId: string) => {
  const {
    data: availableUnits,
    isLoading,
    error,
  } = useAvailableProductUnits(productId);

  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const selectUnit = useCallback((unitId: string) => {
    setSelectedUnits((prev: any) => [...prev, unitId]);
  }, []);

  const deselectUnit = useCallback((unitId: string) => {
    setSelectedUnits((prev: any) => prev.filter((id: any) => id !== unitId));
  }, []);

  const toggleUnit = useCallback((unitId: string) => {
    setSelectedUnits((prev: any) =>
      prev.includes(unitId)
        ? prev.filter((id: any) => id !== unitId)
        : [...prev, unitId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUnits([]);
  }, []);

  const isUnitSelected = useCallback(
    (unitId: string) => {
      return selectedUnits.includes(unitId);
    },
    [selectedUnits]
  );

  return {
    availableUnits: availableUnits || [],
    selectedUnits,
    selectUnit,
    deselectUnit,
    toggleUnit,
    clearSelection,
    isUnitSelected,
    isLoading,
    error: error as Error,
    selectedCount: selectedUnits.length,
  };
};

export const useProductUnitsByStatus = (productId: string) => {
  const { data: allUnits, isLoading, error } = useAllProductUnits(productId);

  const groupedUnits = useMemo(() => {
    if (!allUnits) return {};

    return allUnits.reduce((acc, unit) => {
      if (!acc[unit.status]) {
        acc[unit.status] = [];
      }
      acc[unit.status].push(unit);
      return acc;
    }, {} as Record<string, ProductUnit[]>);
  }, [allUnits]);

  return {
    groupedUnits,
    allUnits: allUnits || [],
    isLoading,
    error: error as Error,
  };
};

export const useProductUnitStats = (productId: string) => {
  const { data: allUnits, isLoading } = useAllProductUnits(productId);

  const stats = useMemo(() => {
    if (!allUnits) {
      return {
        total: 0,
        available: 0,
        loaned: 0,
        maintenance: 0,
        availablePercentage: 0,
      };
    }

    const total = allUnits.length;
    const available = allUnits.filter(
      (unit) => unit.status === "AVAILABLE"
    ).length;
    const loaned = allUnits.filter((unit) => unit.status === "LOANED").length;
    const maintenance = allUnits.filter(
      (unit) => unit.status === "MAINTENANCE"
    ).length;
    const availablePercentage = total > 0 ? (available / total) * 100 : 0;

    return {
      total,
      available,
      loaned,
      maintenance,
      availablePercentage: Math.round(availablePercentage),
    };
  }, [allUnits]);

  return {
    stats,
    isLoading,
  };
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
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });

      const previousProducts = queryClient.getQueryData(
        PRODUCT_QUERY_KEYS.lists()
      );

      const optimisticProduct: Product & { isOptimistic?: boolean } = {
        product_id: `temp-${Date.now()}`,
        product_name: newProduct.product_name,
        product_image: newProduct.product_image,
        quantity: newProduct.quantity,
        category_id: newProduct.category_id,
        product_available: newProduct.product_available,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: (Product & { isOptimistic?: boolean })[] = []) =>
          old.filter((product) => !product.isOptimistic)
      );

      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.detail(data.product_id),
        data
      );

      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.lists(),
        (old: Product[] = []) => [...old, data]
      );

      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (error: Error, variables: CreateProductPayload, context: any) => {
      console.error("❌ Failed to create product:", error.message);

      if (context?.previousProducts) {
        queryClient.setQueryData(
          PRODUCT_QUERY_KEYS.lists(),
          context.previousProducts
        );
      }
    },
  });
};

export function useRepairUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RepairUnitPayload) => {
      const { product_id, unit_id, condition, note } = payload;

      const data = await fetchWithAuth(
        `/api/products/${product_id}/units/repairs`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ unit_id, condition, note }),
        }
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { product_id: string; unit_id: string }) => {
      const { product_id, unit_id } = payload;

      const data = await fetchWithAuth(
        `/api/products/${product_id}/units/retire`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ unit_id }),
        }
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

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
    () => products?.filter((product) => product.product_available > 0) || [],
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
// Tambahkan hooks ini di bagian akhir file useProducts.ts, sebelum export default

// ==================== BATCH UNITS LOADING HOOKS ====================

/**
 * Hook untuk load available units untuk multiple products sekaligus
 * Berguna untuk loan approval flow
 */
export const useBatchLoadAvailableUnits = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [unitsCache, setUnitsCache] = useState<Record<string, ProductUnit[]>>(
    {}
  );

  const loadUnitsForProducts = useCallback(async (productIds: string[]) => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        productIds.map(async (productId) => {
          try {
            const units = await fetchAvailableProductUnits(productId);
            return { productId, units };
          } catch (error) {
            console.error(`Failed to load units for ${productId}:`, error);
            return { productId, units: [] };
          }
        })
      );

      const newCache: Record<string, ProductUnit[]> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          newCache[result.value.productId] = result.value.units;
        }
      });

      setUnitsCache((prev) => ({ ...prev, ...newCache }));
      return newCache;
    } catch (error) {
      console.error("Error loading batch units:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUnitsForSingleProduct = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      const units = await fetchAvailableProductUnits(productId);
      setUnitsCache((prev) => ({ ...prev, [productId]: units }));
      return units;
    } catch (error) {
      console.error(`Error loading units for product ${productId}:`, error);
      setUnitsCache((prev) => ({ ...prev, [productId]: [] }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUnitsForProduct = useCallback(
    async (productId: string) => {
      return loadUnitsForSingleProduct(productId);
    },
    [loadUnitsForSingleProduct]
  );

  const getUnitsForProduct = useCallback(
    (productId: string) => {
      return unitsCache[productId] || [];
    },
    [unitsCache]
  );

  const clearCache = useCallback(() => {
    setUnitsCache({});
  }, []);

  return {
    isLoading,
    unitsCache,
    loadUnitsForProducts,
    loadUnitsForSingleProduct,
    refreshUnitsForProduct,
    getUnitsForProduct,
    clearCache,
  };
};

/**
 * Hook untuk manage unit selection dengan integrated loading
 * Cocok untuk loan approval modal
 */
export const useLoanUnitsManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [unitsCache, setUnitsCache] = useState<Record<string, ProductUnit[]>>(
    {}
  );
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string[]>>(
    {}
  );

  const loadUnitsForProducts = useCallback(async (productIds: string[]) => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        productIds.map(async (productId) => {
          try {
            const units = await fetchAvailableProductUnits(productId);
            return { productId, units };
          } catch (error) {
            console.error(`Failed to load units for ${productId}:`, error);
            return { productId, units: [] };
          }
        })
      );

      const newCache: Record<string, ProductUnit[]> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          newCache[result.value.productId] = result.value.units;
        }
      });

      setUnitsCache((prev) => ({ ...prev, ...newCache }));
      return newCache;
    } catch (error) {
      console.error("Error loading batch units:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUnitsForProduct = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      const units = await fetchAvailableProductUnits(productId);
      setUnitsCache((prev) => ({ ...prev, [productId]: units }));
      return units;
    } catch (error) {
      console.error(`Error refreshing units for product ${productId}:`, error);
      setUnitsCache((prev) => ({ ...prev, [productId]: [] }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleUnitSelection = useCallback(
    (productId: string, unitId: string, maxQuantity: number) => {
      setSelectedUnits((prev) => {
        const currentSelected = prev[productId] || [];
        const isSelected = currentSelected.includes(unitId);

        if (isSelected) {
          // Deselect
          return {
            ...prev,
            [productId]: currentSelected.filter((id) => id !== unitId),
          };
        } else {
          // Select (if not exceeding max)
          if (currentSelected.length < maxQuantity) {
            return {
              ...prev,
              [productId]: [...currentSelected, unitId],
            };
          }
          return prev;
        }
      });
    },
    []
  );

  const getUnitsForProduct = useCallback(
    (productId: string) => {
      return unitsCache[productId] || [];
    },
    [unitsCache]
  );

  const getSelectedUnitsForProduct = useCallback(
    (productId: string) => {
      return selectedUnits[productId] || [];
    },
    [selectedUnits]
  );

  const isUnitSelected = useCallback(
    (productId: string, unitId: string) => {
      return (selectedUnits[productId] || []).includes(unitId);
    },
    [selectedUnits]
  );

  const clearSelections = useCallback(() => {
    setSelectedUnits({});
  }, []);

  const clearCache = useCallback(() => {
    setUnitsCache({});
    setSelectedUnits({});
  }, []);

  return {
    isLoading,
    unitsCache,
    selectedUnits,
    loadUnitsForProducts,
    refreshUnitsForProduct,
    toggleUnitSelection,
    getUnitsForProduct,
    getSelectedUnitsForProduct,
    isUnitSelected,
    clearSelections,
    clearCache,
  };
};

// Update export default
export default {
  useProducts,
  useProductById,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,

  useProductSearch,
  useAvailableProducts,
  useProductsByCategory,

  useProductUnits,
  useAvailableProductUnits,
  useLoanedProductUnits,
  useAllProductUnits,
  useUpdateUnitStatus,
  useUnitSelection,
  useProductUnitsByStatus,
  useProductUnitStats,

  useProductBatchOperations,

  // New batch units hooks
  useBatchLoadAvailableUnits,
  useLoanUnitsManager,
};
