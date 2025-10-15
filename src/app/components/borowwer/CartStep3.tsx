import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useAuthContext } from "@/app/contexts/AuthContext";

interface SelectedUser {
  user_id: string;
  name: string;
  username: string;
}

interface CartStep4Props {
  selectedUsers: SelectedUser[];
  onUsersChange: (users: SelectedUser[]) => void;
}

export default function CartStep3({
  selectedUsers,
  onUsersChange,
}: CartStep4Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { user: currentUser } = useAuthContext();

  const borrowers = useMemo(() => {
    return users.filter(
      (user) => user.role === "BORROWER" && user.user_id !== currentUser?.userId
    );
  }, [users, currentUser]);

  const filteredBorrowers = useMemo(() => {
    if (!searchTerm) return borrowers;
    const term = searchTerm.toLowerCase();
    return borrowers.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
    );
  }, [borrowers, searchTerm]);

  const handleToggleUser = (user: SelectedUser) => {
    const exists = selectedUsers.find((u) => u.user_id === user.user_id);

    if (exists) {
      onUsersChange(selectedUsers.filter((u) => u.user_id !== user.user_id));
    } else {
      onUsersChange([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onUsersChange(selectedUsers.filter((u) => u.user_id !== userId));
  };

  const isUserSelected = (userId: string): boolean => {
    return selectedUsers.some((u) => u.user_id === userId);
  };

  const availableUsers = filteredBorrowers.filter(
    (user) => !isUserSelected(user.user_id)
  );

  return (
    <div className="space-y-4">
      <div className="alert alert-info">
        <div className="text-sm">
          <p className="font-semibold">Pilih anggota tim tambahan</p>
          <p className="mt-1">
            <strong>Peminjam Utama:</strong> {currentUser?.name}
          </p>
          <p className="text-xs mt-1">
            Anda otomatis termasuk sebagai peminjam utama
          </p>
        </div>
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <p className="font-medium mb-2 text-sm text-primary">
            Anggota Terpilih ({selectedUsers.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.user_id}
                className="badge badge-lg badge-primary gap-2 py-3"
              >
                <span className="font-medium">{user.name}</span>
                <button
                  className="btn btn-xs btn-circle btn-ghost hover:bg-primary/20"
                  onClick={() => handleRemoveUser(user.user_id)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="form-control ">
        <label className="input bg-white border-2 border-gray-300 w-full">
          <span className="label">
            <Search className="w-4 h-4 text-black" />
            Cari Anggota Tim
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau username"
          />
        </label>
      </div>

      {/* Users List */}
      <div className="border rounded-lg max-h-60 overflow-y-auto">
        {isLoadingUsers ? (
          <div className="flex justify-center items-center p-6">
            <span className="loading loading-spinner loading-md"></span>
            <span className="ml-2 text-gray-500">Memuat data user...</span>
          </div>
        ) : availableUsers.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-gray-500 mb-2">
              {selectedUsers.length > 0
                ? "Semua user sudah dipilih"
                : "Tidak ada borrower tersedia untuk ditambahkan"}
            </p>
            {selectedUsers.length > 0 && (
              <p className="text-sm text-gray-400">
                Hapus beberapa user dari daftar terpilih untuk memilih yang lain
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {availableUsers.map((user) => (
              <div
                key={user.user_id}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleToggleUser(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {user.name || "No Name"}
                    </p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Total Anggota Tim:</strong> {selectedUsers.length + 1} orang
          (termasuk Anda)
        </p>
      </div>
    </div>
  );
}
