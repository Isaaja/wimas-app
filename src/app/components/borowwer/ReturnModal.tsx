"use client";

import {
  FileText,
  X,
  RefreshCcwDot,
  Package,
  Hash,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  getProductQuantities,
  getUniqueProducts,
  hasUnitAssignments,
  type Loan,
} from "@/hooks/useLoans";

interface ReturnModalProps {
  loan: Loan | null;
  isOpen: boolean;
  isReturning: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReturnModal({
  loan,
  isOpen,
  isReturning,
  onClose,
  onConfirm,
}: ReturnModalProps) {
  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy", { locale: id });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
  };

  if (!isOpen || !loan) return null;

  const productQuantities = getProductQuantities(loan);
  const uniqueProducts = getUniqueProducts(loan);
  const hasUnits = hasUnitAssignments(loan);
  const totalItems = loan.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="modal modal-open flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="modal-box bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] lg:max-h-[90vh] overflow-hidden mt-8 sm:mt-12">
        <div className="p-3 sm:p-4 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Konfirmasi Pengembalian Barang
            </h2>
            <p className="text-sm text-gray-500 mt-1">ID: {loan.loan_id}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full p-1 transition-colors"
            disabled={isReturning}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(80vh-140px)] lg:max-h-[calc(70vh-140px)] space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informasi Peminjaman
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Peminjam Utama
                  </label>
                  <p className="text-sm text-gray-800 font-medium mt-1">
                    {loan.borrower.name || loan.borrower.username}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {loan.borrower.user_id}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    No. SPT
                  </label>
                  <p className="text-sm text-gray-800 font-medium mt-1">
                    {loan.report?.spt_number || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Periode Peminjaman
                  </label>
                  <p className="text-sm text-gray-800 font-medium mt-1">
                    {formatDateOnly(loan.report?.start_date)} -{" "}
                    {formatDateOnly(loan.report?.end_date)}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-medium">
                    Tujuan
                  </label>
                  <p className="text-sm text-gray-800 mt-1">
                    {loan.report?.destination || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Peserta Lain */}
            {loan.invited_users.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-xs text-gray-500 font-medium">
                  Peserta Lain
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {loan.invited_users.map((user) => (
                    <span
                      key={user.user_id}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300"
                    >
                      {user.name || user.username}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Barang yang Akan Dikembalikan */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Barang yang Akan Dikembalikan
              </h3>
              <div className="text-sm text-gray-500">
                {uniqueProducts.length} jenis • {totalItems} total
              </div>
            </div>

            <div className="space-y-4">
              {uniqueProducts.map((product, productIndex) => (
                <div
                  key={product.product_id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {product.product_image ? (
                          <div className="w-10 h-10 relative rounded border border-gray-300 bg-white">
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
                            {productQuantities[product.product_id]} unit
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {productQuantities[product.product_id]}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unit Details */}
                  {hasUnits && (
                    <div className="p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">
                          Detail Unit:
                        </span>
                      </div>
                      <div className="space-y-2">
                        {loan.items
                          .filter(
                            (item) =>
                              item.product_id === product.product_id &&
                              item.unit_id
                          )
                          .map((unitItem, unitIndex) => (
                            <div
                              key={unitItem.unit_id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">
                                  Serial:{" "}
                                  <span className="font-mono">
                                    {unitItem.serial_number || "N/A"}
                                  </span>
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                  Unit #{unitIndex + 1}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Informasi Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800 text-sm sm:text-base mb-2">
                  Informasi Penting Pengembalian
                </h4>
                <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                  <li>
                    • Pastikan semua barang dalam kondisi baik dan lengkap
                  </li>
                  <li>• Periksa kelengkapan aksesori dan komponen</li>
                  <li>• Pastikan tidak ada kerusakan fisik pada barang</li>
                  <li>
                    • Proses pengembalian tidak dapat dibatalkan setelah
                    dikonfirmasi
                  </li>
                  {hasUnits && (
                    <li>
                      • Semua unit yang dipinjam harus dikembalikan bersamaan
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">
              Timeline Peminjaman
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Dibuat:</span>
                <span>{formatDateTime(loan.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Disetujui:</span>
                <span>
                  {loan.status !== "REQUESTED"
                    ? formatDateTime(loan.updated_at)
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status Saat Ini:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    loan.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : loan.status === "RETURNED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {loan.status === "APPROVED"
                    ? "Sedang Dipinjam"
                    : loan.status === "RETURNED"
                    ? "Sudah Dikembalikan"
                    : loan.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-end items-stretch sm:items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium order-2 sm:order-1 flex-1 sm:flex-none"
            disabled={isReturning}
          >
            Batalkan
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium order-1 sm:order-2 flex-1 sm:flex-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isReturning}
          >
            {isReturning ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Memproses Pengembalian...</span>
              </>
            ) : (
              <>
                <RefreshCcwDot className="w-4 h-4 flex-shrink-0" />
                <span>Konfirmasi Pengembalian Barang</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className="modal-backdrop bg-black/50"
        onClick={isReturning ? undefined : onClose}
      ></div>
    </div>
  );
}
