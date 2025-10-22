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
  extractedUserNames?: string[];
}

export default function CartStep3({
  selectedUsers,
  onUsersChange,
  extractedUserNames = [],
}: CartStep4Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { user: currentUser } = useAuthContext();

  const availableBorrowers = useMemo(() => {
    return users.filter((user) => {
      if (user.role !== "BORROWER" || user.user_id === currentUser?.userId) {
        return false;
      }

      const hasActiveLoan = user.loanParticipants?.some(
        (participant) =>
          participant.loan.status === "APPROVED" ||
          participant.loan.status === "REQUESTED"
      );

      return !hasActiveLoan;
    });
  }, [users, currentUser]);

  const filteredBorrowers = useMemo(() => {
    if (!searchTerm) return availableBorrowers;
    const term = searchTerm.toLowerCase();
    return availableBorrowers.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
    );
  }, [availableBorrowers, searchTerm]);

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

  // Helper function untuk mendapatkan status loan terbaru user
  const getUserLoanStatus = (user: any): string | null => {
    if (!user.loanParticipants || user.loanParticipants.length === 0) {
      return "Tidak ada pinjaman";
    }

    const activeLoan = user.loanParticipants.find(
      (participant: any) =>
        participant.loan.status === "APPROVED" ||
        participant.loan.status === "REQUESTED"
    );

    if (activeLoan) {
      return activeLoan.loan.status;
    }

    // Jika tidak ada loan aktif, return status terbaru
    const latestLoan = user.loanParticipants.reduce(
      (latest: any, current: any) => {
        return new Date(current.created_at) > new Date(latest.created_at)
          ? current
          : latest;
      }
    );

    return latestLoan.loan.status;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      APPROVED: { label: "Disetujui", class: "badge-success" },
      REQUESTED: { label: "Menunggu", class: "badge-warning" },
      REJECTED: { label: "Ditolak", class: "badge-error" },
      RETURNED: { label: "Dikembalikan", class: "badge-info" },
    };
    return statusMap[status] || { label: status, class: "badge-ghost" };
  };

  // Auto-select users from extracted names
  const handleAutoSelectExtractedUsers = () => {
    const matchedUsers: SelectedUser[] = [];

    extractedUserNames.forEach((extractedName) => {
      const matchedUser = availableBorrowers.find((user) => {
        const userName = user.name?.toLowerCase() || "";
        const extracted = extractedName.toLowerCase();
        return userName.includes(extracted) || extracted.includes(userName);
      });

      if (
        matchedUser &&
        !selectedUsers.find((u) => u.user_id === matchedUser.user_id)
      ) {
        matchedUsers.push({
          user_id: matchedUser.user_id,
          name: matchedUser.name || "",
          username: matchedUser.username,
        });
      }
    });

    if (matchedUsers.length > 0) {
      onUsersChange([...selectedUsers, ...matchedUsers]);
    }
  };

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

      {/* Extracted Users dari PDF */}
      {extractedUserNames.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-purple-800">
                ✨ Anggota dari Dokumen SPT ({extractedUserNames.length})
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Diekstrak otomatis dari PDF yang diupload
              </p>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleAutoSelectExtractedUsers}
            >
              Pilih Semua
            </button>
          </div>
          <div className="bg-white p-3 rounded max-h-32 overflow-y-auto">
            <ul className="text-sm text-purple-700 space-y-1">
              {extractedUserNames.map((name, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
      <div className="form-control">
        <label className="input bg-white border-2 border-gray-300 w-full flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="flex-1 border-none outline-none bg-transparent"
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
                ? "Semua user available sudah dipilih"
                : "Tidak ada borrower tersedia untuk ditambahkan"}
            </p>
            {selectedUsers.length > 0 ? (
              <p className="text-sm text-gray-400">
                Hapus beberapa user dari daftar terpilih untuk memilih yang lain
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                Semua borrower sedang memiliki pinjaman aktif
                (APPROVED/REQUESTED)
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {availableUsers.map((user) => {
              return (
                <div
                  key={user.user_id}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleToggleUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-800">
                          {user.name || "No Name"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Total Anggota Tim:</strong> {selectedUsers.length + 1} orang
          (termasuk Anda)
        </p>
      </div>
    </div>
  );
}
