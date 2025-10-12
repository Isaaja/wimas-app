"use client";

import { useState, useMemo } from "react";
import { CartItem } from "@/hooks/useCart";
import { InvitedUser } from "@/hooks/useLoans";
import { useUsers } from "@/hooks/useUsers";
import { X } from "lucide-react";

interface CartSummaryProps {
  cart: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onCheckout: (invitedUsers: InvitedUser[], image?: File | null) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function CartSummary({
  cart,
  onRemove,
  onUpdateQty,
  onCheckout,
  onClose,
  isLoading,
}: CartSummaryProps) {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<InvitedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading: isLoadingUsers } = useUsers();

  const borrowers = useMemo(() => {
    return users.filter((user) => user.role === "BORROWER");
  }, [users]);

  const filteredBorrowers = useMemo(() => {
    if (!searchTerm) return borrowers;
    const term = searchTerm.toLowerCase();
    return borrowers.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
    );
  }, [borrowers, searchTerm]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleToggleUser = (user: {
    user_id: string;
    name: string;
    username: string;
  }) => {
    const exists = selectedUsers.find((u) => u.borrower_id === user.user_id);

    if (exists) {
      setSelectedUsers((prev) =>
        prev.filter((u) => u.borrower_id !== user.user_id)
      );
    } else {
      setSelectedUsers((prev) => [
        ...prev,
        {
          borrower_id: user.user_id,
          borrower_name: user.name,
          borrower_username: user.username,
        },
      ]);
    }
  };

  const handleRemoveUser = (borrowerId: string) => {
    setSelectedUsers((prev) =>
      prev.filter((u) => u.borrower_id !== borrowerId)
    );
  };

  const handleSubmit = () => {
    onCheckout(selectedUsers, image);
  };

  const isUserSelected = (userId: string): boolean => {
    return selectedUsers.some((u) => u.borrower_id === userId);
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl bg-white">
        <h3 className="font-bold text-lg border-b pb-2 mb-3">
          {step === 1 && "1️⃣ Pilih Perangkat"}
          {step === 2 && "2️⃣ Upload SPT"}
          {step === 3 && "3️⃣ Pilih Anggota Tim"}
        </h3>

        {/* STEP 1 - PERANGKAT */}
        {step === 1 && (
          <>
            {cart.length === 0 ? (
              <p className="text-center text-gray-500">
                Keranjang masih kosong.
              </p>
            ) : (
              <div className="overflow-y-auto max-h-[55vh] space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        Jumlah: {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          onUpdateQty(
                            item.product_id,
                            Math.max(item.quantity - 1, 1)
                          )
                        }
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          onUpdateQty(item.product_id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                      <button
                        className="btn btn-xs btn-error ml-2"
                        onClick={() => onRemove(item.product_id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 2 - UPLOAD SPT */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Upload dokumen SPT (PDF / JPG / PNG)
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="file-input file-input-bordered w-full"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
            {image && (
              <p className="text-sm text-green-600">
                ✅ File terpilih: {image.name}
              </p>
            )}
          </div>
        )}

        {/* STEP 3 - PILIH ANGGOTA TIM (BORROWERS) */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium mb-2 text-sm">
                  Anggota Terpilih ({selectedUsers.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.borrower_id}
                      className="badge badge-lg badge-primary gap-2"
                    >
                      <span>{user.borrower_name}</span>
                      <button
                        className="btn btn-xs btn-circle btn-ghost"
                        onClick={() => handleRemoveUser(user.borrower_id)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div>
              <label className="block font-medium mb-1">Cari Anggota Tim</label>
              <input
                type="text"
                className="input input-bordered w-full bg-white border-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama atau username..."
              />
            </div>

            {/* User List */}
            <div className="border rounded-lg max-h-[40vh] overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : filteredBorrowers.length === 0 ? (
                <p className="text-center text-gray-500 p-4">
                  {searchTerm
                    ? "Tidak ada user yang sesuai pencarian"
                    : "Tidak ada borrower tersedia"}
                </p>
              ) : (
                <div className="divide-y">
                  {filteredBorrowers.map((user) => (
                    <div
                      key={user.user_id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition ${
                        isUserSelected(user.user_id) ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleToggleUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={isUserSelected(user.user_id)}
                          onChange={() => {}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="modal-action flex justify-between items-center">
          <button className="btn" onClick={onClose}>
            Tutup
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button className="btn btn-outline" onClick={prevStep}>
                ⬅ Prev
              </button>
            )}

            {step < 3 ? (
              <button
                className="btn btn-accent text-black"
                onClick={nextStep}
                disabled={step === 1 && cart.length === 0}
              >
                Next ➡
              </button>
            ) : (
              <button
                className="btn btn-success text-white"
                onClick={handleSubmit}
                disabled={
                  isLoading || cart.length === 0 || selectedUsers.length === 0
                }
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Konfirmasi Pinjam"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
