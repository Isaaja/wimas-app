import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface LoginCredentials {
  username: string;
  password: string;
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

const logoutUser = async (refreshToken: string) => {
  const response = await fetch("/api/authentications", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Logout gagal.");
  }
  return response.json();
};

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Login Error:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
      router.push("/auth");
    },
    onError: (error) => {
      console.error("Logout Error:", error.message);
      router.push("/auth");
    },
  });

  return {
    login: loginMutation,
    logout: logoutMutation,
  };
};