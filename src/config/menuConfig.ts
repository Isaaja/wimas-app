export interface MenuItem {
  label: string;
  href: string;
  icon: string;
}

export const menuConfig: Record<string, MenuItem[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Kelola Barang", href: "/barang", icon: "📦" },
    { label: "Kelola User", href: "/users", icon: "👥" },
    { label: "Persetujuan", href: "/persetujuan", icon: "✅" },
    { label: "Laporan", href: "/laporan", icon: "📈" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ],
  peminjam: [
    { label: "Dashboard", href: "/peminjam/dashboard", icon: "📊" },
    { label: "Peminjaman Saya", href: "/peminjam/peminjaman", icon: "📋" },
    { label: "Riwayat", href: "/peminjam/riwayat", icon: "📜" },
    { label: "Profile", href: "/peminjam/profile", icon: "👤" },
  ],
  petugas: [
    { label: "Dashboard", href: "/petugas/dashboard", icon: "📊" },
    { label: "Kelola Barang", href: "/petugas/barang", icon: "📦" },
    { label: "Persetujuan", href: "/petugas/persetujuan", icon: "✅" },
    { label: "Laporan", href: "/petugas/laporan", icon: "📈" },
  ],
};
