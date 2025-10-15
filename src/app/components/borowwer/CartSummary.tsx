"use client";

import { useState, useMemo } from "react";
import { CartItem } from "@/hooks/useCart";
import { useUsers } from "@/hooks/useUsers";
import { X, Calendar, MapPin, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/contexts/AuthContext";

interface CartSummaryProps {
  cart: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onCheckout: (
    invitedUserIds: string[],
    docsFile?: File | null,
    reportData?: any
  ) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface SelectedUser {
  user_id: string;
  name: string;
  username: string;
}

interface ReportData {
  spt_number: string;
  destination: string;
  place_of_execution: string;
  start_date: string;
  end_date: string;
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
  const [docsFile, setDocsFile] = useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportData, setReportData] = useState<ReportData>({
    spt_number: "",
    destination: "",
    place_of_execution: "",
    start_date: "",
    end_date: "",
  });

  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { user: currentUser } = useAuthContext();
  const router = useRouter();

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
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
    );
  }, [borrowers, searchTerm]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleToggleUser = (user: {
    user_id: string;
    name: string;
    username: string;
  }) => {
    const exists = selectedUsers.find((u) => u.user_id === user.user_id);

    if (exists) {
      setSelectedUsers((prev) =>
        prev.filter((u) => u.user_id !== user.user_id)
      );
    } else {
      setSelectedUsers((prev) => [
        ...prev,
        {
          user_id: user.user_id,
          name: user.name,
          username: user.username,
        },
      ]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      if (file.type !== "application/pdf") {
        alert("Hanya file PDF yang diperbolehkan");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File terlalu besar. Maksimal 5MB");
        e.target.value = "";
        return;
      }

      setDocsFile(file);
    }
  };

  const handleReportChange = (field: keyof ReportData, value: string) => {
    setReportData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    const userIds = selectedUsers.map((u) => u.user_id);
    onCheckout(userIds, docsFile, reportData);
    router.push("/peminjam/peminjaman");
  };

  const isUserSelected = (userId: string): boolean => {
    return selectedUsers.some((u) => u.user_id === userId);
  };

  const isReportValid = useMemo(() => {
    return (
      reportData.spt_number.trim() !== "" &&
      reportData.destination.trim() !== "" &&
      reportData.place_of_execution.trim() !== "" &&
      reportData.start_date !== "" &&
      reportData.end_date !== "" &&
      new Date(reportData.start_date) < new Date(reportData.end_date)
    );
  }, [reportData]);

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg border-b pb-2 mb-3 sticky top-0 bg-white">
          {step === 1 && "1️⃣ Pilih Perangkat"}
          {step === 2 && "2️⃣ Upload Dokumen SPT"}
          {step === 3 && "3️⃣ Data SPT & Kegiatan"}
          {step === 4 && "4️⃣ Pilih Anggota Tim"}
        </h3>

        {/* STEP 1 - PERANGKAT */}
        {step === 1 && (
          <>
            {cart.length === 0 ? (
              <p className="text-center text-gray-500">
                Keranjang masih kosong.
              </p>
            ) : (
              <div className="overflow-y-auto space-y-3">
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
                      <p className="text-xs text-gray-400">
                        Stock tersedia: {item.product_avaible}
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
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          onUpdateQty(item.product_id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.product_avaible}
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

        {/* STEP 2 - UPLOAD DOKUMEN SPT */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Upload dokumen SPT (Opsional - PDF Only, Max 5MB)
            </p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="file-input file-input-bordered w-full bg-white border-gray-400 border-2"
              onChange={handleFileChange}
            />
            {docsFile && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  ✅ File terpilih: {docsFile.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Ukuran: {(docsFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  className="btn btn-xs btn-error mt-2"
                  onClick={() => setDocsFile(null)}
                >
                  Hapus File
                </button>
              </div>
            )}
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div className="text-sm">
                <p className="font-semibold">Catatan:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Hanya file PDF yang diperbolehkan</li>
                  <li>Ukuran maksimal 5MB</li>
                  <li>Data SPT akan diisi manual di step berikutnya</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - FORM DATA SPT & KEGIATAN */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="alert alert-info">
              <FileText className="w-5 h-5" />
              <div>
                <h3 className="font-bold">Data SPT & Kegiatan</h3>
                <p className="text-sm">Isi informasi SPT dan detail kegiatan</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nomor SPT */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nomor SPT *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered bg-white"
                  placeholder="Contoh: 001/SPT/IT/2024"
                  value={reportData.spt_number}
                  onChange={(e) =>
                    handleReportChange("spt_number", e.target.value)
                  }
                  required
                />
              </div>

              {/* Tujuan Kegiatan */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Tujuan Kegiatan *
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered bg-white"
                  placeholder="Contoh: Maintenance Server"
                  value={reportData.destination}
                  onChange={(e) =>
                    handleReportChange("destination", e.target.value)
                  }
                  required
                />
              </div>

              {/* Tempat Pelaksanaan */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Tempat Pelaksanaan *
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered bg-white"
                  placeholder="Contoh: Kantor Pusat"
                  value={reportData.place_of_execution}
                  onChange={(e) =>
                    handleReportChange("place_of_execution", e.target.value)
                  }
                  required
                />
              </div>

              {/* Tanggal Mulai & Selesai */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tanggal Mulai *
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered bg-white"
                    value={reportData.start_date}
                    onChange={(e) =>
                      handleReportChange("start_date", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tanggal Selesai *
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered bg-white"
                    value={reportData.end_date}
                    onChange={(e) =>
                      handleReportChange("end_date", e.target.value)
                    }
                    min={
                      reportData.start_date ||
                      new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </div>
              </div>

              {/* Preview Data */}
              {(reportData.spt_number ||
                reportData.destination ||
                reportData.place_of_execution) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Preview Data SPT:
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    {reportData.spt_number && (
                      <p>📄 No. SPT: {reportData.spt_number}</p>
                    )}
                    {reportData.destination && (
                      <p>🎯 Tujuan: {reportData.destination}</p>
                    )}
                    {reportData.place_of_execution && (
                      <p>📍 Tempat: {reportData.place_of_execution}</p>
                    )}
                    {reportData.start_date && reportData.end_date && (
                      <p>
                        📅 Periode:{" "}
                        {new Date(reportData.start_date).toLocaleDateString(
                          "id-ID"
                        )}{" "}
                        -{" "}
                        {new Date(reportData.end_date).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {reportData.start_date &&
                reportData.end_date &&
                new Date(reportData.start_date) >=
                  new Date(reportData.end_date) && (
                  <div className="alert alert-warning">
                    <span>⚠️ Tanggal selesai harus setelah tanggal mulai</span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* STEP 4 - PILIH ANGGOTA TIM (BORROWERS) */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div className="text-sm">
                <p className="font-semibold">Pilih anggota tim tambahan</p>
                <p className="mt-1">
                  <strong>Peminjam:</strong> {currentUser?.name}
                </p>
                <p className="text-xs mt-1">
                  Anda otomatis termasuk sebagai peminjam utama
                </p>
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium mb-2 text-sm">
                  Anggota Terpilih ({selectedUsers.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="badge badge-lg badge-primary gap-2"
                    >
                      <span>{user.name}</span>
                      <button
                        className="btn btn-xs btn-circle btn-ghost"
                        onClick={() => handleRemoveUser(user.user_id)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <div className="border rounded-lg max-h-[20vh] overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : filteredBorrowers.filter(
                  (user) => !isUserSelected(user.user_id)
                ).length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-gray-500 mb-2">
                    {selectedUsers.length > 0
                      ? "Semua user sudah dipilih"
                      : "Tidak ada borrower tersedia untuk ditambahkan"}
                  </p>
                  {selectedUsers.length > 0 && (
                    <p className="text-sm text-gray-400">
                      Hapus beberapa user dari daftar terpilih untuk memilih
                      yang lain
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredBorrowers
                    .filter((user) => !isUserSelected(user.user_id))
                    .map((user) => (
                      <div
                        key={user.user_id}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition"
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
        <div className="modal-action flex justify-between items-center sticky bottom-0 bg-white pt-4 border-t">
          <button className="btn" onClick={onClose} disabled={isLoading}>
            Tutup
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                className="btn btn-outline"
                onClick={prevStep}
                disabled={isLoading}
              >
                ⬅ Prev
              </button>
            )}

            {step < 4 ? (
              <button
                className="btn btn-accent text-black"
                onClick={nextStep}
                disabled={
                  (step === 1 && cart.length === 0) ||
                  (step === 3 && !isReportValid)
                }
              >
                {step === 3 ? "Lanjut ke Anggota Tim ➡" : "Next ➡"}
              </button>
            ) : (
              <button
                className="btn btn-success text-white"
                onClick={handleSubmit}
                disabled={isLoading || cart.length === 0}
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
        <button onClick={onClose} disabled={isLoading}>
          close
        </button>
      </form>
    </dialog>
  );
}
