import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface LoanParticipant {
  id: string;
  role: "OWNER" | "INVITED";
  created_at: string;
  loan: {
    loan_id: string;
    status: "REQUESTED" | "APPROVED" | "REJECTED" | "RETURNED";
    created_at: string;
    updated_at: string;
  };
}

export interface User {
  user_id: string;
  name: string;
  username: string;
  email: string | null;
  noHandphone: string | null;
  role: "ADMIN" | "SUPERADMIN" | "BORROWER";
  loanParticipants: LoanParticipant[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  username: string;
  name: string;
}

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  password?: string;
  email?: string | null;
  noHandphone?: string | null;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
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

export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  lists: () => [...USER_QUERY_KEYS.all, "list"] as const,
  list: (filters?: any) =>
    [...USER_QUERY_KEYS.lists(), { ...filters }] as const,
  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
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

// ==================== OPTIMIZED HOOKS DENGAN CACHING ====================

export const useUsers = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(),
    queryFn: fetchUsers,
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.MEDIUM_TERM,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
        refetchType: "active",
      });

      queryClient.setQueryData(
        USER_QUERY_KEYS.detail(newUser.user_id),
        newUser
      );

      console.log("✅ User created:", newUser);
    },
    onError: (error: Error) => {
      console.error("❌ Failed to create user:", error.message);
    },
  });
};

const fetchUserById = async (userId: string): Promise<User> => {
  const token = getAccessToken();

  const response = await fetch(`/api/users/${userId}`, {
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

  const result: ApiResponse<User> = await response.json();
  return result.data;
};

export const useUserById = (userId: string) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(userId),
    queryFn: () => fetchUserById(userId),
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.LONG_TERM,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateUserPayload;
    }) => updateUser(userId, payload),
    onSuccess: (updatedUser, variables) => {
      queryClient.setQueryData(
        USER_QUERY_KEYS.detail(variables.userId),
        updatedUser
      );

      queryClient.setQueriesData(
        { queryKey: USER_QUERY_KEYS.lists() },
        (old: User[] | undefined) => {
          if (!old) return old;
          return old.map((user) =>
            user.user_id === variables.userId
              ? { ...user, ...variables.payload }
              : user
          );
        }
      );

      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
        refetchType: "active",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Failed to update user:", error.message);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, deletedUserId) => {
      queryClient.removeQueries({
        queryKey: USER_QUERY_KEYS.detail(deletedUserId),
      });

      queryClient.setQueriesData(
        { queryKey: USER_QUERY_KEYS.lists() },
        (old: User[] | undefined) => {
          if (!old) return old;
          return old.filter((user) => user.user_id !== deletedUserId);
        }
      );

      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
        refetchType: "active",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Failed to delete user:", error.message);
    },
  });
};
