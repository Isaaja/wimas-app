import {
  LayoutDashboard,
  Users,
  FolderTree,
  Laptop,
  ClipboardList,
  History,
  User,
  Settings,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const menuConfig: Record<string, MenuItem[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "User", href: "/user", icon: Users },
    { label: "Kategori", href: "/kategori", icon: FolderTree },
    { label: "Alat dan Perangkat", href: "/alatperangkat", icon: Laptop },
    { label: "Daftar Peminjam", href: "/peminjam", icon: ClipboardList },
    { label: "Riwayat Peminjaman", href: "/riwayat", icon: History },
    { label: "Profil", href: "/profil", icon: User },
  ],
  peminjam: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Alat dan Perangkat", href: "/alatperangkat", icon: Laptop },
    { label: "Peminjaman", href: "/peminjaman", icon: ClipboardList },
    { label: "Riwayat Peminjaman", href: "/riwayat", icon: History },
    { label: "Profil", href: "/profil", icon: User },
  ],
  superadmin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "User", href: "/user", icon: Users },
    { label: "Alat dan Perangkat", href: "/alatperangkat", icon: Laptop },
    { label: "Daftar Peminjam", href: "/peminjam", icon: ClipboardList },
    { label: "Riwayat Peminjaman", href: "/riwayat", icon: History },
    { label: "Profil", href: "/profil", icon: User },
  ],
};
