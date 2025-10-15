"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { menuConfig } from "@/config/menuConfig";
import { useAuthContext } from "../../contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleColors: Record<
  string,
  { bg: string; hover: string; accent: string }
> = {
  superadmin: {
    bg: "from-red-700 to-red-600",
    hover: "hover:bg-red-500/70",
    accent: "bg-red-200 text-red-900",
  },
  admin: {
    bg: "from-blue-700 to-blue-600",
    hover: "hover:bg-blue-500/70",
    accent: "bg-blue-200 text-blue-900",
  },
  peminjam: {
    bg: "from-green-700 to-green-600",
    hover: "hover:bg-green-500/70",
    accent: "bg-green-200 text-green-900",
  },
};

const roleMap: Record<string, string> = {
  borrower: "peminjam",
  admin: "admin",
  superadmin: "superadmin",
};

// 🏷️ Label role untuk tampilan UI (display text)
const displayRoleMap: Record<string, string> = {
  peminjam: "Peminjam",
  admin: "Admin",
  superadmin: "Super Admin",
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthContext();

  if (!user) return null;

  // 🔄 Mapping role dari token
  const mappedRole =
    roleMap[user.role.toLowerCase()] || user.role.toLowerCase();
  const displayRole = displayRoleMap[mappedRole] || mappedRole;
  const menuItems = menuConfig[mappedRole] || menuConfig.peminjam;
  const colors = roleColors[mappedRole] || roleColors.peminjam;

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 lg:top-16 left-0 h-screen lg:h-[calc(100vh-4rem)] bg-gradient-to-b ${
          colors.bg
        } text-white z-50 transition-transform duration-300 w-64 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <span className="inline-block text-xs bg-white/20 px-2 py-1 rounded-full capitalize mt-1">
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 h-[calc(100vh-300px)]">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const rolePath = `/${mappedRole}`;
              const fullPath = `${rolePath}${item.href}`;
              const isActive = pathname === fullPath;

              return (
                <li key={index}>
                  <Link
                    href={fullPath}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive ? colors.accent : `text-white/80 ${colors.hover}`
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className={`p-4 border-t border-white/20 absolute bottom-0 left-0 right-0 bg-gradient-to-b ${colors.bg}`}
        >
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/80 hover:bg-red-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">
              {logout.isPending ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
