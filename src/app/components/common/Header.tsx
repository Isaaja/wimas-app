"use client";

import Image from "next/image";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-40 flex items-center px-4 lg:px-6">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3"
        aria-label="Toggle Sidebar"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div className="flex items-center space-x-3">
        <div className="lg:w-12 w-8 lg:h-12 h-8 flex items-center justify-center">
          <Image
            src="/img/komdigifix.png"
            width={500}
            height={500}
            alt="Picture of the author"
          />
        </div>
        <div>
          <h1 className="lg:text-lg text-[10px] font-semibold text-gray-800">
            Warehouse Inventory Management System
          </h1>
          <p className="lg:text-xs text-[8px] text-gray-500">
            Balai Monitor Spektrum Frekuensi Radio Kelas 1 Semarang
          </p>
        </div>
      </div>

      <div className="flex-1"></div>
    </header>
  );
}
