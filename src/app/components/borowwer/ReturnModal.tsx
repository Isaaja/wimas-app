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
    <div className="modal modal-open flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="modal-box bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] lg:max-h-[90vh] overflow-hidden mt-8 sm:mt-12">
        <div className="p-3 sm:p-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Nota Pengembalian
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full p-1 transition-colors"
            disabled={isReturning}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(70vh-140px)] lg:max-h-[calc(90vh-140px)]">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">
              Informasi Peminjaman
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="font-medium text-gray-600 block text-xs sm:text-sm mb-1">
                    No. SPT:
                  </span>
                  <p className="text-gray-800 font-medium truncate">
                    {loan.report?.spt_number || "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="font-medium text-gray-600 block text-xs sm:text-sm mb-1">
                    Peminjam:
                  </span>
                  <p className="text-gray-800 font-medium truncate">
                    {loan.participants?.find((p) => p.role === "OWNER")?.user
                      .name || "-"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="font-medium text-gray-600 block text-xs sm:text-sm mb-1">
                    Tanggal Mulai:
                  </span>
                  <p className="text-gray-800 font-medium">
                    {formatDateOnly(loan.report?.start_date)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="font-medium text-gray-600 block text-xs sm:text-sm mb-1">
                    Tanggal Selesai:
                  </span>
                  <p className="text-gray-800 font-medium">
                    {formatDateOnly(loan.report?.end_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">
              Barang yang Dikembalikan ({loan.items.length})
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {loan.items.map((item, index) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Jumlah: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-xs">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800 text-sm sm:text-base mb-1">
                  Informasi Pengembalian
                </h4>
                <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed">
                  Pastikan semua barang dalam kondisi baik dan lengkap sebelum
                  melakukan pengembalian. Pengembalian yang sudah diproses tidak
                  dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50 flex flex-col xs:flex-row gap-2 sm:gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base order-2 xs:order-1 flex-1 xs:flex-none"
            disabled={isReturning}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium order-1 xs:order-2 flex-1 xs:flex-none flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isReturning}
          >
            {isReturning ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <RefreshCcwDot className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Konfirmasi Pengembalian</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}
