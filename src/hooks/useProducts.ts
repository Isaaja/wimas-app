import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// ==================== CACHE CONFIGURATION ====================

const CACHE_CONFIG = {
  SHORT_TERM: 2 * 60 * 1000, // 2 menit
  MEDIUM_TERM: 5 * 60 * 1000, // 5 menit
  LONG_TERM: 10 * 60 * 1000, // 10 menit

  STALE_SHORT: 1 * 60 * 1000, // 1 menit
  STALE_MEDIUM: 3 * 60 * 1000, // 3 menit
};

// ==================== QUERY KEYS ====================

export const PRODUCT_QUERY_KEYS = {
  all: ["products"] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, "list"] as const,
  list: (params?: GetProductsParams) =>
    [...PRODUCT_QUERY_KEYS.lists(), { ...params }] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
} as const;

// ==================== API FUNCTIONS ====================

const getAccessToken = (): string => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];
    return cookieToken || "";
  }

  return token;
};

const fetchProducts = async (
  params?: GetProductsParams
): Promise<Product[]> => {
  const token = getAccessToken();

  const queryParams = new URLSearchParams();
  if (params?.product_name)
    queryParams.append("product_name", params.product_name);
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.order) queryParams.append("order", params.order);

  const queryString = queryParams.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil data produk");
  }

  const result: ApiResponse<Product[]> = await response.json();
  return result.data;
};

const createProduct = async (
  payload: CreateProductPayload
): Promise<Product> => {
  const token = getAccessToken();

  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menambahkan produk");
  }

  const result: ApiResponse<{ result: Product }> = await response.json();
  return result.data.result;
};

// ==================== OPTIMIZED HOOKS DENGAN CACHING ====================

export const fetchProductById = async (id: string): Promise<Product> => {
  const token = getAccessToken();
  const res = await fetch(`/api/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Gagal memuat produk");
  }

  const data = await res.json();
  return data.data.item;
};

export const updateProduct = async ({
  id,
  payload,
}: {
  id: string;
  payload: Partial<Product>;
}) => {
  const token = getAccessToken();

  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Gagal memperbarui produk");
  }

  return data.data.result;
};

export const deleteProduct = async (id: string) => {
  const token = getAccessToken();

  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Gagal menghapus produk");
  }

  return data.message;
};

export const useProducts = (params?: GetProductsParams) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(params),
    queryFn: () => fetchProducts(params),
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.MEDIUM_TERM,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.lists(),
        refetchType: "active",
      });

      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.detail(newProduct.product_id),
        newProduct
      );

      console.log("✅ Product created:", newProduct);
    },
    onError: (error: Error) => {
      console.error("❌ Failed to create product:", error.message);
    },
  });
};

export function useProductById(id: string) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
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
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (updatedProduct, variables) => {
      queryClient.setQueryData(
        PRODUCT_QUERY_KEYS.detail(variables.id), 
        updatedProduct
      );
      
      queryClient.invalidateQueries({ 
        queryKey: PRODUCT_QUERY_KEYS.lists(),
        refetchType: 'active'
      });
      
      queryClient.setQueriesData(
        { queryKey: PRODUCT_QUERY_KEYS.lists() },
        (old: Product[] | undefined) => {
          if (!old) return old;
          return old.map(product => 
            product.product_id === variables.id 
              ? { ...product, ...variables.payload }
              : product
          );
        }
      );
    },
    onError: (error: Error) => {
      console.error("❌ Failed to update product:", error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ 
        queryKey: PRODUCT_QUERY_KEYS.detail(deletedId) 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: PRODUCT_QUERY_KEYS.lists(),
        refetchType: 'active'
      });
      
      queryClient.setQueriesData(
        { queryKey: PRODUCT_QUERY_KEYS.lists() },
        (old: Product[] | undefined) => {
          if (!old) return old;
          return old.filter(product => product.product_id !== deletedId);
        }
      );
    },
    onError: (error: Error) => {
      console.error("❌ Failed to delete product:", error.message);
    },
  });
}
