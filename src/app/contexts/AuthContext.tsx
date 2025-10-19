"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  userId: string;
  name: string;
  role: string;
  username?: string;
  email?: string;
  noHandphone?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const userId = localStorage.getItem("userId");
        const name = localStorage.getItem("name");
        const role = localStorage.getItem("userRole");
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");
        const noHandphone = localStorage.getItem("noHandphone");
        const created_at = localStorage.getItem("created_at");
        const updated_at = localStorage.getItem("updated_at");

        if (userId && name && role) {
          setUserState({
            userId,
            name,
            role,
            username: username || undefined,
            email: email || undefined,
            noHandphone: noHandphone || undefined,
            created_at: created_at || undefined,
            updated_at: updated_at || undefined,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const setUser = (userData: User) => {
    setUserState(userData);
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("name", userData.name);
    localStorage.setItem("userRole", userData.role);

    // Simpan field tambahan jika ada
    if (userData.username) localStorage.setItem("username", userData.username);
    if (userData.email) localStorage.setItem("email", userData.email);
    if (userData.noHandphone)
      localStorage.setItem("noHandphone", userData.noHandphone);
    if (userData.created_at)
      localStorage.setItem("created_at", userData.created_at);
    if (userData.updated_at)
      localStorage.setItem("updated_at", userData.updated_at);
  };

  const clearUser = () => {
    setUserState(null);
    // Hapus semua data user dari localStorage
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("noHandphone");
    localStorage.removeItem("created_at");
    localStorage.removeItem("updated_at");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUserState(updatedUser);

      if (data.name) localStorage.setItem("name", data.name);
      if (data.username) localStorage.setItem("username", data.username);
      if (data.email) localStorage.setItem("email", data.email);
      if (data.noHandphone)
        localStorage.setItem("noHandphone", data.noHandphone);
      if (data.updated_at) localStorage.setItem("updated_at", data.updated_at);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setUser,
    clearUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
