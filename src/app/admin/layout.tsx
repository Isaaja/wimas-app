"use client";

import Header from "@/app/components/common/Header";
import Sidebar from "@/app/components/common/Sidebar";
import { useState } from "react";

export default function PeminjamDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="relative pt-16 lg:ml-64 p-6 z-10 min-h-screen">
        {children}
      </main>
    </div>
  );
}
