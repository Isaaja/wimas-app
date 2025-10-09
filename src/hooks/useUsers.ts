import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  user_id: string;
  name: string;
  username: string;
  email: string;
  noHandphone: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserPayload {
  username: string;
  name: string;
}

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  password?: string;
  email?: string;
  noHandphone?: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
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

const fetchUsers = async (): Promise<User[]> => {
  const token = getAccessToken();

  const response = await fetch("/api/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil data user");
  }

  const result: ApiResponse<User[]> = await response.json();
  return result.data;
};

const createUser = async (payload: {
  name: string;
  username: string;
}): Promise<User> => {
  const token = getAccessToken();

  const finalPayload = {
    name: payload.name,
    username: payload.username,
    password: payload.username,
  };

  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
    body: JSON.stringify(finalPayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menambahkan user");
  }

  const result: ApiResponse<User> = await response.json();
  return result.data;
};

const updateUser = async (
  id: string,
  payload: UpdateUserPayload
): Promise<User> => {
  const token = getAccessToken();

  const response = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengupdate user");
  }

  const result: ApiResponse<User> = await response.json();
  return result.data;
};

const deleteUser = async (id: string): Promise<void> => {
  const token = getAccessToken();

  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menghapus user");
  }
};

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
