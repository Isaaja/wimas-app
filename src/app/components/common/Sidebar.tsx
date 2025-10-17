"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { menuConfig } from "@/config/menuConfig";
import { useAuthContext } from "../../contexts/AuthContext";
import { LogOut } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleColors: Record<
  string,
  { bg: string; hover: string; accent: string; text: string }
> = {
  superadmin: {
    bg: "from-indigo-800 to-indigo-700",
    hover: "hover:bg-indigo-600/80",
    accent: "bg-indigo-100 text-indigo-900",
    text: "text-indigo-100",
  },
  admin: {
    bg: "from-blue-800 to-blue-700",
    hover: "hover:bg-blue-600/80",
    accent: "bg-blue-100 text-blue-900",
    text: "text-blue-100",
  },
  peminjam: {
    bg: "from-sky-600 to-sky-500",
    hover: "hover:bg-sky-500/80",
    accent: "bg-sky-100 text-sky-900",
    text: "text-sky-100",
  },
};

const roleMap: Record<string, string> = {
  borrower: "peminjam",
  admin: "admin",
  superadmin: "superadmin",
};

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
        <div className="p-6 border-b border-white/20 flex justify-center items-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className={`w-20 h-20 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg ${colors.text}`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="font-semibold text-lg text-white font-mono tracking-wider">
                {user.name}
              </p>
              <span
                className={`inline-block text-xs ${colors.text} bg-white/20 px-2 py-1 font-sans tracking-widest rounded-full capitalize mt-1`}
              >
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 h-[calc(100vh-300px)]">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const rolePath = `/${mappedRole}`;
              const fullPath = `${rolePath}${item.href}`;
              const isActive = pathname === fullPath;
              const IconComponent = item.icon;

              return (
                <li key={index}>
                  <Link
                    href={fullPath}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? `${colors.accent} font-semibold`
                        : `text-white/90 ${colors.hover}`
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
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
            className={`w-full flex space-x-3 px-4 py-3 rounded-lg btn border-0 outline-0 transition-colors text-white/90
      ${
        logout.isPending
          ? "bg-red-500 disabled:cursor-not-allowed"
          : "btn-soft btn-error"
      }`}
          >
            <span className="text-xl">
              <LogOut />
            </span>
            <span className="font-medium">
              {logout.isPending ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
