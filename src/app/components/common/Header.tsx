"use client";

import { useState } from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-40 flex items-center px-4 lg:px-6">
      {/* Mobile Menu Toggle */}
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

      {/* Logo and Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
          W
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Wisma App</h1>
          <p className="text-xs text-gray-500">Management System</p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right side - Optional: Notifications, Profile, etc */}
      <div className="flex items-center space-x-4">
        {/* You can add notifications, profile dropdown, etc here */}
      </div>
    </header>
  );
}
