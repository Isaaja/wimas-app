// components/CartSummary.tsx
"use client";

import { useState } from "react";
import { CartItem } from "@/hooks/useCart";
import CartStep1 from "./CartStep1";
import CartStep2 from "./CartStep2";
import CartStep3 from "./CartStep3";

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
  const [reportData, setReportData] = useState<ReportData>({
    spt_number: "",
    destination: "",
    place_of_execution: "",
    start_date: "",
    end_date: "",
  });

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    const userIds = selectedUsers.map((u) => u.user_id);
    onCheckout(userIds, docsFile, reportData);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "1️⃣ Pilih Perangkat";
      case 2:
        return "2️⃣ Upload Dokumen SPT & Data Kegiatan";
      case 3:
        return "3️⃣ Pilih Anggota Tim";
      default:
        return "";
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return cart.length > 0;
      case 2:
        return (
          reportData.spt_number.trim() !== "" &&
          reportData.destination.trim() !== "" &&
          reportData.place_of_execution.trim() !== "" &&
          reportData.start_date !== "" &&
          reportData.end_date !== "" &&
          new Date(reportData.start_date) < new Date(reportData.end_date)
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl bg-white p-0 overflow-hidden flex flex-col max-h-[70vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <h3 className="font-bold text-lg">{getStepTitle()}</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <CartStep1
              cart={cart}
              onRemove={onRemove}
              onUpdateQty={onUpdateQty}
            />
          )}

          {step === 2 && (
            <CartStep2
              docsFile={docsFile}
              reportData={reportData}
              onFileChange={setDocsFile}
              onReportChange={setReportData}
            />
          )}

          {step === 3 && (
            <CartStep3
              selectedUsers={selectedUsers}
              onUsersChange={setSelectedUsers}
            />
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
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
                  ⬅ Kembali
                </button>
              )}

              {step < 3 ? (
                <button
                  className="btn btn-accent text-black"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                >
                  Lanjutkan ➡
                </button>
              ) : (
                <button
                  className="btn btn-success text-white"
                  onClick={handleSubmit}
                  disabled={isLoading || cart.length === 0}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm text-info"></span>
                  ) : (
                    "Konfirmasi Pinjam"
                  )}
                </button>
              )}
            </div>
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
