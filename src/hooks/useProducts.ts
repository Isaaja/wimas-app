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
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      console.log(newProduct);
    },
    onError: (error: Error) => {
      console.error(error.message);
    },
  });
};

export function useProductById(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
