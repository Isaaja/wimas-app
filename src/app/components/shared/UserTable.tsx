"use client";

import { User } from "@/hooks/useUsers";

interface UserTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onPageChange: (page: number) => void;
}

export default function UserTable({
  users,
  currentPage,
  totalPages,
  onDelete,
  onPageChange,
}: UserTableProps) {
  return (
    <>
      <div className="overflow-x-auto overflow-auto bg-white rounded-lg shadow">
        <table className="table text-gray-700">
          <thead className="bg-gray-200 text-gray-700">
            <tr className="text-gray-700 text-center">
              <th className="text-center lg:text-xl text-xs">#</th>
              <th className="text-center lg:text-xl text-xs">Nama</th>
              <th className="text-center lg:text-xl text-xs">Username</th>
              <th className="text-center lg:text-xl text-xs">Email</th>
              <th className="text-center lg:text-xl text-xs">No HP</th>
              <th className="text-center lg:text-xl text-xs">Role</th>
              <th className="text-center lg:text-xl text-xs">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: User, index: number) => (
              <tr key={user.user_id} className="hover text-center">
                <td className="border-t border-black/10 lg:text-xl text-xs">{index + 1}</td>
                <td className="border-t border-black/10 lg:text-xl text-xs font-bold">
                  {user.name}
                </td>
                <td className="border-t border-black/10 lg:text-xl text-xs">{user.username}</td>
                <td className="border-t border-black/10 lg:text-xl text-xs">{user.email}</td>
                <td className="border-t border-black/10 lg:text-xl text-xs">{user.noHandphone}</td>
                <td className="border-t border-black/10 lg:text-xl text-xs">
                  <span
                    className={`
    inline-flex items-center rounded-md bg-gradient-to-r px-2 py-1 text-xs font-medium ring-1 ring-inset shadow-sm
    ${
      user.role === "ADMIN"
        ? "from-blue-800/20 to-blue-700/10 text-blue-700 ring-blue-700/30"
        : user.role === "BORROWER"
        ? "from-sky-500/20 to-sky-400/10 text-sky-500 ring-sky-400/30"
        : "from-gray-500/20 to-gray-400/10 text-gray-600 ring-gray-400/30"
    }
  `}
                  >
                    {user.role === "ADMIN"
                      ? "Admin"
                      : user.role === "BORROWER"
                      ? "Peminjam"
                      : user.role}
                  </span>
                </td>
                <td className="border-t border-black/10 lg:text-xl text-xs text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => onDelete?.(user)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4">
        <div className="flex">
          {currentPage} of {totalPages} pages
        </div>
        <div className="flex gap-5">
          <button
            className="join-item btn btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="join-item btn btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
