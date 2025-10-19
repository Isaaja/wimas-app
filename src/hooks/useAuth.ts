import { useAuthContext } from "@/app/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface LoginCredentials {
  username: string;
  password: string;
}

interface LogoutResponse {
  status: string;
  message: string;
}

interface LogoutError {
  status: string;
  message: string;
}

const loginUser = async (credentials: LoginCredentials) => {
  const response = await fetch("/api/authentications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login gagal.");
  }
  return response.json();
};

const logoutUser = async (): Promise<LogoutResponse> => {
  let refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    refreshToken =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("refreshToken="))
        ?.split("=")[1] || null;
  }

  if (!refreshToken) {
    throw {
      status: "fail",
      message: "Refresh token tidak ditemukan",
    } as LogoutError;
  }

  const response = await fetch("/api/authentications", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data as LogoutError;
  }

  return data;
};

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, clearUser } = useAuthContext();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setUser({
        userId: data.data.include.userId,
        name: data.data.include.name || "User",
        role: data.data.include.role,
      });

      if (data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
      }
      if (data.data?.refreshToken) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
      }

      queryClient.invalidateQueries({ queryKey: ["user"] });

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 100);
    },
    onError: (error) => {
      console.error("Login Error:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: (data) => {
      clearUser();

      queryClient.clear();
      toast.success("Berhasil logout 👋", { autoClose: 2500 });

      router.push("/auth");
      router.refresh();
    },
    onError: (error: LogoutError) => {
      clearUser();
      queryClient.clear();

      document.cookie =
        "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      document.cookie =
        "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";

      toast.error(error?.message || "Logout gagal, tetapi sesi telah dihapus", {
        autoClose: 3000,
      });
      router.push("/auth");
      router.refresh();
    },
  });

  return {
    login: loginMutation,
    logout: logoutMutation,
  };
};
