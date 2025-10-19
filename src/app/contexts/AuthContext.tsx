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

        if (userId && name && role) {
          setUserState({
            userId,
            name,
            role,
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
  };

  const clearUser = () => {
    setUserState(null);
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("userRole");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
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
