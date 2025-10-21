"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,

  ReactNode,
} from "react";

interface User {
  userId: string;
  name: string;
  username?: string;
  email?: string | null;
  noHandphone?: string | null;
  role: string;
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
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");
        const noHandphone = localStorage.getItem("noHandphone");
        const role = localStorage.getItem("userRole");
        const created_at = localStorage.getItem("created_at");
        const updated_at = localStorage.getItem("updated_at");

        if (userId && name && role) {
          setUserState({
            userId,
            name,
            username: username || undefined,
            email: email || null,
            noHandphone: noHandphone || null,
            role,
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

    // Store additional fields if available
    if (userData.username) localStorage.setItem("username", userData.username);
    if (userData.email !== undefined)
      localStorage.setItem("email", userData.email || "");
    if (userData.noHandphone !== undefined)
      localStorage.setItem("noHandphone", userData.noHandphone || "");
    if (userData.created_at)
      localStorage.setItem("created_at", userData.created_at);
    if (userData.updated_at)
      localStorage.setItem("updated_at", userData.updated_at);
  };

  const clearUser = () => {
    setUserState(null);
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("noHandphone");
    localStorage.removeItem("userRole");
    localStorage.removeItem("created_at");
    localStorage.removeItem("updated_at");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const updateUser = useCallback((data: Partial<User>) => {
    setUserState((prevUser) => {
      if (!prevUser) return null;

      const updatedUser = { ...prevUser, ...data };

      // Update localStorage
      localStorage.setItem("userId", updatedUser.userId);
      localStorage.setItem("name", updatedUser.name);
      localStorage.setItem("userRole", updatedUser.role);

      if (updatedUser.username)
        localStorage.setItem("username", updatedUser.username);
      if (updatedUser.email !== undefined)
        localStorage.setItem("email", updatedUser.email || "");
      if (updatedUser.noHandphone !== undefined)
        localStorage.setItem("noHandphone", updatedUser.noHandphone || "");
      if (updatedUser.created_at)
        localStorage.setItem("created_at", updatedUser.created_at);
      if (updatedUser.updated_at)
        localStorage.setItem("updated_at", updatedUser.updated_at);

      return updatedUser;
    });
  }, []);

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
