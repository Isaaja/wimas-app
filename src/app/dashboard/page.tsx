"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const page = () => {
  const { logout } = useAuth();
  const [refreshToken, setRefreshToken] = useState("");

  useEffect(() => {
    setRefreshToken(localStorage.getItem("refreshToken") || "");
  }, []);

  const handleLogout = () => {
    if (refreshToken) {
      logout.mutate(refreshToken);
    }
  };

  return (
    <div className="flex w-full justify-between">
      <h1>Dashboard</h1>
      <button onClick={handleLogout} disabled={logout.isPending}>
        {logout.isPending ? "Keluar..." : "Keluar"}
      </button>
    </div>
  );
};

export default page;
