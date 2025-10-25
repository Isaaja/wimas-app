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
} from "lucide-react";
import Image from "next/image";

interface Loan {
  loan_id: string;
  status: string;
  participants: Array<{
    id: string;
    role: string;
    user: {
      name: string;
      email?: string;
      phone?: string;
    };
  }>;
  report?: {
    spt_number?: string | null;
    spt_file?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    purpose?: string | null;
    destination?: string | null;
    place_of_execution?: string | null;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    description?: string;
    product_image: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

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

  if (!isVisible || !loan) return null;

  const owner = loan.participants.find((p) => p.role === "OWNER");
  const otherParticipants = loan.participants.filter((p) => p.role !== "OWNER");
  const sptFileUrl = getSptFileUrl(loan.report?.spt_file);

  return (
    <div className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box p-0 max-w-2xl max-h-[80vh] flex flex-col bg-white border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Detail Peminjaman
            </h2>
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
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {loan.status === "REQUESTED"
                  ? "Menunggu"
                  : loan.status === "APPROVED"
                  ? "Disetujui"
                  : loan.status === "REJECTED"
                  ? "Ditolak"
                  : "Dikembalikan"}
              </span>
              <span className="text-xs text-gray-600">
                {formatDate(loan.updated_at)}
              </span>
            </div>
            {loan.status === "APPROVED" && (
              <div className="flex">
                <button
                  className="btn btn-ghost btn-xs text-green-600"
                  onClick={() => onNota(loan.loan_id)}
                >
                  <FileText className="w-4 h-4" />
                  Nota Peminjaman
                </button>
              </div>
            )}
          </div>

          {/* Informasi Peminjam */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-600" />
              <label className="text-xs text-gray-500 font-medium">
                Informasi Peminjam
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loan.participants
                .filter((participant) => participant.role === "OWNER")
                .map((participant) => (
                  <div key={participant.id} className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Pemilik</p>
                      <p className="text-sm text-gray-800 font-medium">
                        {participant.user.name}
                      </p>
                    </div>
                    {participant.user.email && (
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-800">
                          {participant.user.email}
                        </p>
                      </div>
                    )}
                    {participant.user.phone && (
                      <div>
                        <p className="text-xs text-gray-500">Telepon</p>
                        <p className="text-sm text-gray-800">
                          {participant.user.phone}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Peserta Lain */}
          {otherParticipants.length > 0 && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-500 font-medium">
                  Peserta Lain ({otherParticipants.length})
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {otherParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="px-3 py-2 bg-gray-100 rounded border border-gray-200"
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {participant.user.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barang yang Dipinjam */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-gray-600" />
              <label className="text-xs text-gray-500 font-medium">
                Perangkat ({loan.items.length})
              </label>
            </div>

            <div className="space-y-2">
              {loan.items.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Tidak ada barang yang dipinjam
                </p>
              ) : (
                loan.items.map((item, index) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded border border-gray-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.product_name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium border border-blue-200">
                      {item.quantity}x
                    </span>
                  </div>
                ))
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

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">No. SPT</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {loan.report.spt_number || "-"}
                    </p>
                  </div>
                  {loan.report.destination && (
                    <div>
                      <p className="text-xs text-gray-500">Tujuan</p>
                      <p className="text-sm text-gray-800">
                        {loan.report.destination}
                      </p>
                    </div>
                  )}
                </div>

                {loan.report.place_of_execution && (
                  <div>
                    <p className="text-xs text-gray-500">Tempat Pelaksanaan</p>
                    <p className="text-sm text-gray-800">
                      {loan.report.place_of_execution}
                    </p>
                  </div>
                )}

                {loan.report.purpose && (
                  <div>
                    <p className="text-xs text-gray-500">Tujuan Peminjaman</p>
                    <p className="text-sm text-gray-800">
                      {loan.report.purpose}
                    </p>
                  </div>
                )}

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
                  <div className="pt-2">
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
        <div className="flex justify-end p-4 border-t border-gray-200 bg-white">
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
