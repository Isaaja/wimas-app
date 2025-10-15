"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import UserTable from "@/app/components/shared/UserTable";
import Loading from "@/app/components/common/Loading";

export default function UserPage() {
  const { data: users = [], isLoading } = useUsers();

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(users.length / usersPerPage);

  const displayedUsers = users.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  if (isLoading) return <Loading />;

  return (
    <div className="p-5">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Daftar User</h1>
      </div>

      <UserTable
        users={displayedUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
