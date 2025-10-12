"use client";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";

const Page = () => {
  const { logout } = useAuth();
  const { user } = useAuthContext();

  if (!user) return null;

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div style={{ position: "relative", zIndex: 1000 }}>
      <h1>hai, {user.name}</h1>
      <button
        onClick={handleLogout}
        disabled={logout.isPending}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
      >
        {logout.isPending ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
};

export default Page;
