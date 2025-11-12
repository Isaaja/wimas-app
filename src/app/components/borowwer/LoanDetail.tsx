"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  X,
  Download,
  User,
  Users,
  Package,
  FileText,
  Calendar,
  Hash,
  CheckCircle,
  Copy,
} from "lucide-react";
import {
  getProductQuantities,
  getUniqueProducts,
  hasUnitAssignments,
  getProductUnits,
  productHasUnits,
  type Loan,
} from "@/hooks/useLoans";

interface LoanDetailProps {
  loan: Loan | null;
  isOpen: boolean;
  onNota: (loanId: string) => void;
  onClose: () => void;
}

export default function LoanDetail({
  loan,
  isOpen,
  onClose,
  onNota,
}: LoanDetailProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copiedUnitId, setCopiedUnitId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy", { locale: id });
  };

  const getSptFileUrl = (sptFile: string | null | undefined): string | null => {
    if (!sptFile) return null;
    if (sptFile.startsWith("http")) return sptFile;
    if (sptFile.startsWith("public/")) {
      return sptFile.replace("public/", "/");
    }
    if (sptFile.startsWith("/")) return sptFile;
    return `/${sptFile}`;
  };

  const getUnitStatusBadge = (status?: string) => {
    switch (status) {
      case "AVAILABLE":
        return <span className="badge badge-success badge-sm">Tersedia</span>;
      case "LOANED":
        return <span className="badge badge-warning badge-sm">Dipinjam</span>;
      case "MAINTENANCE":
        return <span className="badge badge-error badge-sm">Perbaikan</span>;
      case "ASSIGNED":
        return <span className="badge badge-info badge-sm">Ditugaskan</span>;
      case "PENDING":
        return <span className="badge badge-ghost badge-sm">Menunggu</span>;
      default:
        return <span className="badge badge-ghost badge-sm">Unknown</span>;
    }
  };

  const copyToClipboard = async (text: string, unitId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUnitId(unitId);
      setTimeout(() => setCopiedUnitId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!isVisible || !loan) return null;

  // ✅ Safe access dengan default values
  const sptFileUrl = getSptFileUrl(loan.report?.spt_file);
  const hasUnits = hasUnitAssignments(loan);
  const productQuantities = getProductQuantities(loan);
  const uniqueProducts = getUniqueProducts(loan);
  const invitedUsers = loan.invited_users || [];
  const items = loan.items || [];

  return (
    <div className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box p-0 max-w-4xl max-h-[85vh] flex flex-col bg-white border border-gray-200 mt-12">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Detail Peminjaman
            </h2>
            <p className="text-sm text-gray-500 mt-1">ID: {loan.loan_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {/* Status & Actions */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  loan.status === "REQUESTED"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : loan.status === "APPROVED"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : loan.status === "REJECTED"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : loan.status === "RETURNED"
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {loan.status === "REQUESTED"
                  ? "Menunggu"
                  : loan.status === "APPROVED"
                  ? "Disetujui"
                  : loan.status === "REJECTED"
                  ? "Ditolak"
                  : loan.status === "RETURNED"
                  ? "Dikembalikan"
                  : "Selesai"}
              </span>
              {hasUnits && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs border border-purple-200">
                  ✓ Ada Unit Assignment
                </span>
              )}
              <span className="text-xs text-gray-600">
                {formatDate(loan.updated_at)}
              </span>
            </div>
            {(loan.status === "APPROVED" ||
              loan.status === "RETURNED" ||
              loan.status === "DONE") && (
              <div className="flex">
                <button
                  onClick={() => onNota(loan.loan_id)}
                  className="btn btn-ghost btn-xs text-green-600"
                >
                  <FileText className="w-4 h-4" />
                  Lihat Nota
                </button>
              </div>
            )}
          </div>

          {/* Informasi Peminjam */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Peminjam Utama */}
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-500 font-medium">
                  Peminjam Utama
                </label>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Nama</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {loan.borrower?.name ||
                      loan.borrower?.username ||
                      "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Username</p>
                  <p className="text-sm text-gray-800">
                    {loan.borrower?.username || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-sm text-gray-800 font-mono">
                    {loan.borrower?.user_id || "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            {/* Peserta Lain */}
            {invitedUsers.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-600" />
                  <label className="text-xs text-gray-500 font-medium">
                    Peserta Lain ({invitedUsers.length})
                  </label>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {invitedUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="px-3 py-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {user.name || user.username || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.user_id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Barang yang Dipinjam */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-500 font-medium">
                  Perangkat ({uniqueProducts.length} jenis, {items.length}{" "}
                  total)
                </label>
              </div>
              <div className="text-xs text-gray-500">
                {loan.status === "REQUESTED"
                  ? "Quantity Requested"
                  : "Unit Assigned"}
              </div>
            </div>

            <div className="space-y-3">
              {uniqueProducts.length > 0 ? (
                uniqueProducts.map((product) => {
                  const quantity = productQuantities[product.product_id] || 0;
                  const productUnits = getProductUnits(
                    loan,
                    product.product_id
                  );
                  const hasAssignedUnits = productHasUnits(
                    loan,
                    product.product_id
                  );

                  return (
                    <div
                      key={product.product_id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Product Header */}
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {product.product_image ? (
                              <div className="w-10 h-10 relative rounded border border-gray-300">
                                <img
                                  src={product.product_image}
                                  alt={product.product_name}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {product.product_name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {quantity} unit
                                {hasAssignedUnits &&
                                  ` • ${productUnits.length} unit assigned`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {quantity}x
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Unit Details (hanya untuk loan yang sudah di-approve) */}
                      {loan.status !== "REQUESTED" && (
                        <div className="p-3 bg-white">
                          <div className="flex items-center gap-2 mb-3">
                            <Hash className="w-3 h-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">
                              Detail Unit ({productUnits.length} unit):
                            </span>
                          </div>

                          {productUnits.length > 0 ? (
                            <div className="space-y-2">
                              {/* Tampilkan semua units */}
                              {productUnits.map((unit: any, index: any) => (
                                <div
                                  key={unit.unit_id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-800">
                                        {unit.serial_number}
                                      </span>
                                      {getUnitStatusBadge(unit.unit_status)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 font-mono">
                                        ID: {unit.unit_id}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            unit.unit_id,
                                            unit.unit_id
                                          )
                                        }
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        title="Copy Unit ID"
                                      >
                                        <Copy
                                          className={`w-3 h-3 ${
                                            copiedUnitId === unit.unit_id
                                              ? "text-green-600"
                                              : "text-gray-400"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded border">
                                    #{index + 1}
                                  </div>
                                </div>
                              ))}

                              {/* Summary */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">
                                    Total Unit:
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      productUnits.length === quantity
                                        ? "text-green-600"
                                        : productUnits.length > quantity
                                        ? "text-blue-600"
                                        : "text-orange-600"
                                    }`}
                                  >
                                    {productUnits.length} dari {quantity} unit
                                  </span>
                                </div>
                                {productUnits.length < quantity && (
                                  <div className="mt-1 text-xs text-orange-600">
                                    ⚠️ {quantity - productUnits.length} unit
                                    belum ditugaskan
                                  </div>
                                )}
                                {productUnits.length > quantity && (
                                  <div className="mt-1 text-xs text-blue-600">
                                    ℹ️ Lebih banyak unit yang ditugaskan
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <span className="text-xs">
                                Belum ada unit yang ditugaskan untuk produk ini
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Untuk loan yang belum di-approve */}
                      {loan.status === "REQUESTED" && (
                        <div className="p-3 bg-white">
                          <div className="text-center py-2">
                            <span className="text-xs text-gray-500">
                              Menunggu persetujuan dan penugasan {quantity} unit
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Tidak ada barang yang dipinjam
                </div>
              )}
            </div>
          </div>

          {/* Informasi SPT */}
          {loan.report && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-500 font-medium">
                  Informasi SPT
                </label>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">No. SPT</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {loan.report.spt_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tujuan</p>
                    <p className="text-sm text-gray-800">
                      {loan.report.destination}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Tempat Pelaksanaan</p>
                  <p className="text-sm text-gray-800">
                    {loan.report.place_of_execution}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Tanggal Mulai</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDateOnly(loan.report.start_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tanggal Selesai</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDateOnly(loan.report.end_date)}
                    </p>
                  </div>
                </div>

                {sptFileUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <a
                      href={sptFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download SPT
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-600" />
              <label className="text-xs text-gray-500 font-medium">
                Informasi Waktu
              </label>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Dibuat:</span>
                <span>{formatDate(loan.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Diupdate:</span>
                <span>{formatDate(loan.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
