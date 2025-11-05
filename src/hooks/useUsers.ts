import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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

// ==================== OPTIMIZED CACHE CONFIGURATION ====================
const CACHE_CONFIG = {
  SHORT_TERM: 2 * 60 * 1000,
  MEDIUM_TERM: 5 * 60 * 1000,
  LONG_TERM: 10 * 60 * 1000,

  STALE_SHORT: 30 * 1000,
  STALE_MEDIUM: 2 * 60 * 1000,
} as const;

// ==================== OPTIMIZED QUERY KEYS ====================
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  lists: () => [...USER_QUERY_KEYS.all, "list"] as const,
  list: (filters?: any) =>
    [...USER_QUERY_KEYS.lists(), ...(filters ? [filters] : [])] as const,
  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
  profile: () => [...USER_QUERY_KEYS.all, "profile"] as const,
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
const fetchUsers = async (): Promise<User[]> => {
  return fetchWithAuth("/api/users");
};

const fetchUserById = async (userId: string): Promise<User> => {
  return fetchWithAuth(`/api/users/${userId}`);
};

const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const finalPayload = {
    name: payload.name,
    username: payload.username,
    password: payload.username, // Default password sama dengan username
  };

  return fetchWithAuth("/api/users", {
    method: "POST",
    body: JSON.stringify(finalPayload),
  });
};

const updateUser = async (
  id: string,
  payload: UpdateUserPayload
): Promise<User> => {
  return fetchWithAuth(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

const deleteUser = async (id: string): Promise<void> => {
  await fetchWithAuth(`/api/users/${id}`, {
    method: "DELETE",
  });
};

// ==================== OPTIMIZED QUERY HOOKS ====================

export const useUsers = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(),
    queryFn: fetchUsers,
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.MEDIUM_TERM,
    retry: (failureCount, error) =>
      failureCount < 2 && !error.message.includes("Token"),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useUserById = (userId: string) => {
  const queryKey = useMemo(() => USER_QUERY_KEYS.detail(userId), [userId]);

  return useQuery({
    queryKey,
    queryFn: () => fetchUserById(userId),
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
    enabled: !!userId,
  });
};

// ==================== OPTIMIZED MUTATION HOOKS ====================

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onMutate: async (newUser: CreateUserPayload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.lists() });

      // Snapshot previous values
      const previousUsers = queryClient.getQueryData(USER_QUERY_KEYS.lists());

      // Optimistically update to the new value
      const optimisticUser: User & { isOptimistic?: boolean } = {
        ...newUser,
        user_id: `temp-${Date.now()}`,
        email: null,
        noHandphone: null,
        role: "BORROWER",
        loanParticipants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData(USER_QUERY_KEYS.lists(), (old: User[] = []) => [
        ...old,
        optimisticUser,
      ]);

      return { previousUsers };
    },
    onSuccess: (data: User, variables: CreateUserPayload, context: any) => {
      // Remove optimistic user and replace with real data
      queryClient.setQueryData(
        USER_QUERY_KEYS.lists(),
        (old: (User & { isOptimistic?: boolean })[] = []) =>
          old.filter((user) => !user.isOptimistic)
      );

      // Update cache dengan data dari server
      queryClient.setQueryData(USER_QUERY_KEYS.detail(data.user_id), data);
      queryClient.setQueryData(USER_QUERY_KEYS.lists(), (old: User[] = []) => [
        ...old,
        data,
      ]);

      // Smart invalidation
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (error: Error, variables: CreateUserPayload, context: any) => {
      console.error("❌ Failed to create user:", error.message);

      // Rollback optimistic update
      if (context?.previousUsers) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.lists(),
          context.previousUsers
        );
      }
    },
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
    onMutate: async (variables: {
      userId: string;
      payload: UpdateUserPayload;
    }) => {
      await queryClient.cancelQueries({
        queryKey: USER_QUERY_KEYS.detail(variables.userId),
      });
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.lists() });

      const previousUser = queryClient.getQueryData(
        USER_QUERY_KEYS.detail(variables.userId)
      );

      const previousUsers = queryClient.getQueryData(USER_QUERY_KEYS.lists());

      // Optimistically update user detail
      if (previousUser) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.detail(variables.userId),
          (old: User) => ({
            ...old,
            ...variables.payload,
            updated_at: new Date().toISOString(),
          })
        );
      }

      // Optimistically update users list
      queryClient.setQueryData(USER_QUERY_KEYS.lists(), (old: User[] = []) =>
        old.map((user) =>
          user.user_id === variables.userId
            ? {
                ...user,
                ...variables.payload,
                updated_at: new Date().toISOString(),
              }
            : user
        )
      );

      return { previousUser, previousUsers };
    },
    onSuccess: (
      updatedUser: User,
      variables: { userId: string; payload: UpdateUserPayload }
    ) => {
      // Ensure cache is updated with server data
      queryClient.setQueryData(
        USER_QUERY_KEYS.detail(variables.userId),
        updatedUser
      );

      queryClient.setQueryData(USER_QUERY_KEYS.lists(), (old: User[] = []) =>
        old.map((user) =>
          user.user_id === variables.userId ? updatedUser : user
        )
      );

      // Invalidasi queries yang mungkin terpengaruh
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (
      error: Error,
      variables: { userId: string; payload: UpdateUserPayload },
      context: any
    ) => {
      console.error("❌ Failed to update user:", error.message);

      // Rollback optimistic updates
      if (context?.previousUser) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.detail(variables.userId),
          context.previousUser
        );
      }

      if (context?.previousUsers) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.lists(),
          context.previousUsers
        );
      }
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.lists() });

      const previousUsers = queryClient.getQueryData(USER_QUERY_KEYS.lists());

      const previousUser = queryClient.getQueryData(
        USER_QUERY_KEYS.detail(userId)
      );

      // Optimistically remove from list
      queryClient.setQueryData(USER_QUERY_KEYS.lists(), (old: User[] = []) =>
        old.filter((user) => user.user_id !== userId)
      );

      // Remove detail query
      queryClient.removeQueries({
        queryKey: USER_QUERY_KEYS.detail(userId),
      });

      return { previousUsers, previousUser, deletedId: userId };
    },
    onSuccess: (data: void, userId: string, context: any) => {
      // Additional cleanup jika diperlukan
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
        refetchType: "inactive",
      });
    },
    onError: (error: Error, userId: string, context: any) => {
      console.error("❌ Failed to delete user:", error.message);

      // Rollback optimistic removal
      if (context?.previousUsers) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.lists(),
          context.previousUsers
        );
      }

      // Restore detail query jika ada
      if (context?.previousUser) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.detail(userId),
          context.previousUser
        );
      }
    },
  });
};

// ==================== OPTIMIZED SPECIALIZED HOOKS ====================

export const useUsersByRole = (role?: User["role"]) => {
  const { data: users, ...queryInfo } = useUsers();

  const usersByRole = useMemo(() => {
    if (!users || !role) return users || [];
    return users.filter((user) => user.role === role);
  }, [users, role]);

  return {
    users: usersByRole,
    ...queryInfo,
  };
};

export const useUserSearch = (searchTerm: string) => {
  const { data: users, ...queryInfo } = useUsers();

  const filteredUsers = useMemo(() => {
    if (!users || !searchTerm) return users || [];

    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        (user.email?.toLowerCase().includes(term) ?? false)
    );
  }, [users, searchTerm]);

  return {
    users: filteredUsers,
    ...queryInfo,
  };
};

export const useBorrowers = () => {
  return useUsersByRole("BORROWER");
};

export const useAdmins = () => {
  return useUsersByRole("ADMIN");
};

// ==================== OPTIMIZED PROFILE HOOKS ====================

export const useUserProfile = () => {
  const queryKey = useMemo(() => USER_QUERY_KEYS.profile(), []);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<User> => {
      // Endpoint untuk mendapatkan profile user yang sedang login
      return fetchWithAuth("/api/users/profile");
    },
    staleTime: CACHE_CONFIG.STALE_MEDIUM,
    gcTime: CACHE_CONFIG.MEDIUM_TERM,
    retry: 1,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => {
      // Endpoint untuk update profile user yang sedang login
      return fetchWithAuth("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (updatedUser: User) => {
      // Update profile cache
      queryClient.setQueryData(USER_QUERY_KEYS.profile(), updatedUser);

      // Update user dalam list jika ada
      queryClient.setQueryData(USER_QUERY_KEYS.lists(), (old: User[] = []) =>
        old.map((user) =>
          user.user_id === updatedUser.user_id ? updatedUser : user
        )
      );

      // Update detail cache jika ada
      queryClient.setQueryData(
        USER_QUERY_KEYS.detail(updatedUser.user_id),
        updatedUser
      );
    },
    onError: (error: Error) => {
      console.error("❌ Failed to update profile:", error.message);
    },
  });
};

// ==================== OPTIMIZED BATCH OPERATIONS ====================

export const useUserBatchOperations = () => {
  const queryClient = useQueryClient();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const updateMultipleUsers = useCallback(
    async (updates: Array<{ userId: string; payload: UpdateUserPayload }>) => {
      const results = await Promise.allSettled(
        updates.map((update) => updateUserMutation.mutateAsync(update))
      );

      const successful = results.filter(
        (result): result is PromiseFulfilledResult<User> =>
          result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );

      // Invalidasi cache setelah batch update
      if (successful.length > 0) {
        queryClient.invalidateQueries({
          queryKey: USER_QUERY_KEYS.lists(),
          refetchType: "active",
        });
      }

      return {
        successful: successful.map((s) => s.value),
        failed: failed.map((f) => f.reason),
      };
    },
    [updateUserMutation, queryClient]
  );

  const deleteMultipleUsers = useCallback(
    async (userIds: string[]) => {
      const results = await Promise.allSettled(
        userIds.map((userId) => deleteUserMutation.mutateAsync(userId))
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
          queryKey: USER_QUERY_KEYS.lists(),
          refetchType: "active",
        });
      }

      return {
        successful: successful.map((s) => s.value),
        failed: failed.map((f) => f.reason),
      };
    },
    [deleteUserMutation, queryClient]
  );

  return {
    updateMultipleUsers,
    deleteMultipleUsers,
    isPending: updateUserMutation.isPending || deleteUserMutation.isPending,
  };
};

// ==================== OPTIMIZED STATISTICS HOOKS ====================

export const useUserStatistics = () => {
  const { data: users, ...queryInfo } = useUsers();

  const statistics = useMemo(() => {
    if (!users) return null;

    const totalUsers = users.length;
    const borrowers = users.filter((user) => user.role === "BORROWER").length;
    const admins = users.filter((user) => user.role === "ADMIN").length;
    const superAdmins = users.filter(
      (user) => user.role === "SUPERADMIN"
    ).length;
    const usersWithLoans = users.filter(
      (user) => user.loanParticipants.length > 0
    ).length;

    return {
      totalUsers,
      borrowers,
      admins,
      superAdmins,
      usersWithLoans,
      usersWithoutLoans: totalUsers - usersWithLoans,
    };
  }, [users]);

  return {
    statistics,
    ...queryInfo,
  };
};
