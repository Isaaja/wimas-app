export interface MenuItem {
  label: string;
  href: string;
  icon: string;
}

export const menuConfig: Record<string, MenuItem[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "" },
    { label: "User", href: "/user", icon: "" },
    { label: "Kategori", href: "/kategori", icon: "" },
    { label: "Alat dan Perangkat", href: "/alatperangkat", icon: "" },
    { label: "Daftar Peminjam", href: "/peminjam", icon: "" },
    { label: "Riwayat Peminjaman", href: "/riwayat", icon: "" },
    { label: "Profil", href: "/profil", icon: "" },
  ],
  peminjam: [
    { label: "Dashboard", href: "/dashboard", icon: "" },
    { label: "Peminjam", href: "/peminjaman", icon: "" },
    { label: "Riwayat Peminjaman", href: "/riwayat", icon: "" },
    { label: "Profil", href: "/profil", icon: "" },
  ],
  superadmin: [
    { label: "Dashboard", href: "/dashboard", icon: "" },
    { label: "User", href: "/user", icon: "" },
    { label: "Alat dan Perangkat", href: "/alatperangkat", icon: "" },
    { label: "Daftar Peminjam", href: "/peminjam", icon: "" },
    { label: "Riwayat Peminjaman", href: "/riwayat", icon: "" },
    { label: "Profil", href: "/profil", icon: "" },
  ],
};
