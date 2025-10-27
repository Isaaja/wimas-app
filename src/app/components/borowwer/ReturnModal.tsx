"use client";

import { FileText, X, RefreshCcwDot } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Loan {
  loan_id: string;
  status: string;
  participants: Array<{
    id: string;
    role: string;
    user: {
      name: string;
    };
  }>;
  report?: {
    spt_number?: string | null;
    spt_file?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    product_image: string;
  }>;
}

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

  if (!isOpen || !loan) return null;

  return (
    <div className="modal modal-open flex items-center justify-center z-50 p-4">
      <div className="modal-box bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Nota Pengembalian</h2>
          <button
            onClick={onClose}
            className=" hover:bg-gray-200 rounded-full p-1 transition-colors"
            disabled={isReturning}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(60vh-80px)]">
          {/* Informasi Peminjaman */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Informasi Peminjaman
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">No. SPT:</span>
                <p className="mt-1">{loan.report?.spt_number || "-"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Peminjam:</span>
                <p className="mt-1">
                  {loan.participants?.find((p) => p.role === "OWNER")?.user
                    .name || "-"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  Tanggal Mulai:
                </span>
                <p className="mt-1">
                  {formatDateOnly(loan.report?.start_date)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  Tanggal Selesai:
                </span>
                <p className="mt-1">{formatDateOnly(loan.report?.end_date)}</p>
              </div>
            </div>
          </div>

          {/* Daftar Barang */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Barang yang Dikembalikan
            </h3>
            <div className="space-y-3">
              {loan.items.map((item, index) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {item.product_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Jumlah: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      Barang #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Informasi Pengembalian */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Informasi Pengembalian
            </h4>
            <p className="text-sm text-yellow-700">
              Pastikan semua barang dalam kondisi baik dan lengkap sebelum
              melakukan pengembalian. Pengembalian yang sudah diproses tidak
              dapat dibatalkan.
            </p>
          </div>
        </div>

        {/* Footer dengan tombol aksi */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isReturning}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            disabled={isReturning}
          >
            {isReturning ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <RefreshCcwDot className="w-4 h-4" />
                <span>Konfirmasi Pengembalian</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
