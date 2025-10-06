import { useQuery } from "@tanstack/react-query";

export interface Category {
  category_id: string;
  category_name: string;
  created_at?: string;
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

const fetchCategories = async (): Promise<Category[]> => {
  const token = getAccessToken();

  const res = await fetch("/api/category", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal memuat kategori");
  }

  const data = await res.json();
  return data.result;
};

export function useCategories() {
  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
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
