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
      console.log("✅ Produk berhasil ditambahkan:", newProduct);
    },
    onError: (error: Error) => {
      console.error("❌ Gagal menambahkan produk:", error.message);
    },
  });
};
