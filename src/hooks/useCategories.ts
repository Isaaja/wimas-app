"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Category {
  category_id: string;
  category_name: string;
  created_at?: string;
}

export interface CategoryPayload {
  category_name: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

const getAccessToken = (): string => {
  if (typeof window === "undefined") return "";

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

const categoryFetcher = async <T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: CategoryPayload
): Promise<T> => {
  const token = getAccessToken();

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(data && { body: JSON.stringify(data) }),
    ...(method === "GET" && { cache: "no-store" }),
  };

  const response = await fetch(url, options);

  const responseData: ApiResponse<T> = await response.json().catch(() => ({}));

  if (!response.ok || responseData.statusCode >= 400) {
    throw new Error(
      responseData.message ||
        `Gagal memuat data dari ${url}. Status: ${response.status}`
    );
  }

  return responseData.data;
};

export function useCategories() {
  const queryKey = ["categories"];

  const { data, error, isLoading, refetch, isFetching } = useQuery<
    Category[],
    Error
  >({
    queryKey: queryKey,
    queryFn: () => categoryFetcher<Category[]>("/api/category", "GET"),
    retry: false,
  });

  return {
    data,
    isLoading,
    isFetching,
    isError: !!error,
    error,
    refetch,
  };
}

export function useGetCategoryById(categoryId: string) {
  const queryKey = ["categories", categoryId];

  return useQuery<Category, Error>({
    queryKey: queryKey,
    queryFn: () =>
      categoryFetcher<Category>(`/api/category/${categoryId}`, "GET"),
    enabled: !!categoryId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, CategoryPayload>({
    mutationFn: (newCategory: CategoryPayload) =>
      categoryFetcher<Category>("/api/category", "POST", newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      console.log("Kategori berhasil dibuat!");
    },
    onError: (error) => {
      console.error("Gagal membuat kategori:", error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; payload: CategoryPayload }>({
    mutationFn: ({ id, payload }) =>
      categoryFetcher<void>(`/api/category/${id}`, "PUT", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", variables.id] });
      console.log(`Kategori ID ${variables.id} berhasil diperbarui!`);
    },
    onError: (error) => {
      console.error("Gagal memperbarui kategori:", error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) =>
      categoryFetcher<void>(`/api/category/${id}`, "DELETE"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.removeQueries({ queryKey: ["categories", id] });
      console.log(`Kategori ID ${id} berhasil dihapus!`);
    },
    onError: (error) => {
      console.error("Gagal menghapus kategori:", error.message);
    },
  });
}
