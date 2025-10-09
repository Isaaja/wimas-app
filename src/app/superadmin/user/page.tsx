"use client";

import { useState } from "react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  User,
} from "@/hooks/useUsers";
import { toast } from "react-toastify";
import UserTable from "@/app/components/UserTable";
import UserModal from "@/app/components/UserModal";
import { usePathname } from "next/navigation";

export default function SuperAdminUserPage() {
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const totalPages = Math.ceil(users.length / usersPerPage);

  const pathname = usePathname();
  const isAdminUserPage = pathname === "/admin/user";

  const handleAdd = () => {
    setModalMode("add");
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser.mutateAsync(user.user_id);
      toast.success("User berhasil dihapus!");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus user");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (modalMode === "add") {
        await createUser.mutateAsync(data);
        toast.success("User berhasil ditambahkan!");
      } else if (modalMode === "edit" && selectedUser) {
        await updateUser.mutateAsync({ id: selectedUser.user_id, data });
        toast.success("User berhasil diperbarui!");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const displayedUsers = users.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-5">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Daftar User</h1>
        {!isAdminUserPage && (
          <button className="btn btn-primary" onClick={handleAdd}>
            + Tambah User
          </button>
        )}
      </div>

      <UserTable
        users={displayedUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onDelete={handleDelete}
        onPageChange={setCurrentPage}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedUser={selectedUser}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
