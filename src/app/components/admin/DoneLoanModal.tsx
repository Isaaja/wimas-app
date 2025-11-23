"use client";

import { useState, useEffect } from "react";
import { Loan, getProductUnits } from "@/hooks/useLoans";
import { X, CheckCircle, AlertTriangle, Package } from "lucide-react";

interface DoneLoanModalProps {
  loan: Loan | null;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (unitConditions: Record<string, string>) => void;
}

type UnitCondition = {
  unit_id: string;
  serial_number: string;
  product_name: string;
  condition: "GOOD" | "DAMAGED";
};

export default function DoneLoanModal({
  loan,
  isOpen,
  isProcessing,
  onClose,
  onConfirm,
}: DoneLoanModalProps) {
  const [unitConditions, setUnitConditions] = useState<UnitCondition[]>([]);

  // Get unique units from loan
  const getUniqueUnits = (loan: Loan): UnitCondition[] => {
    if (!loan.items) return [];

    const uniqueUnits = new Map<string, UnitCondition>();

    loan.items.forEach((item) => {
      const productUnits = getProductUnits(loan, item.product_id);

      productUnits.forEach((unit) => {
        if (unit.unit_id && !uniqueUnits.has(unit.unit_id)) {
          uniqueUnits.set(unit.unit_id, {
            unit_id: unit.unit_id,
            serial_number: unit.serial_number || "Tidak ada serial",
            product_name: item.product_name,
            condition: "GOOD",
          });
        }
      });
    });

    return Array.from(uniqueUnits.values());
  };

  useEffect(() => {
    if (loan && isOpen) {
      const uniqueUnits = getUniqueUnits(loan);
      setUnitConditions(uniqueUnits);
    }
  }, [loan, isOpen]);

  const handleConditionChange = (
    unitId: string,
    condition: "GOOD" | "DAMAGED"
  ) => {
    setUnitConditions((prev) =>
      prev.map((unit) =>
        unit.unit_id === unitId ? { ...unit, condition } : unit
      )
    );
  };

  const handleConfirm = () => {
    const conditionsRecord: Record<string, string> = {};
    unitConditions.forEach((unit) => {
      conditionsRecord[unit.unit_id] = unit.condition;
    });

    onConfirm(conditionsRecord);
  };

  const getConditionCount = () => {
    const good = unitConditions.filter(
      (unit) => unit.condition === "GOOD"
    ).length;
    const damaged = unitConditions.filter(
      (unit) => unit.condition === "DAMAGED"
    ).length;
    return { good, damaged };
  };

  if (!isOpen || !loan) return null;

  const { good, damaged } = getConditionCount();
  const totalUnits = unitConditions.length;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl max-h-[80vh] flex flex-col bg-white p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Konfirmasi Pengembalian
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Periksa kondisi barang yang dikembalikan
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {/* Summary Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Ringkasan Barang
              </h3>
              <span className="text-sm text-gray-500">{totalUnits} barang</span>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xl font-bold text-green-600">{good}</div>
                <div className="text-sm text-green-700">Baik</div>
              </div>
              <div className="flex-1 text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xl font-bold text-red-600">{damaged}</div>
                <div className="text-sm text-red-700">Rusak</div>
              </div>
            </div>
          </div>

          {/* Unit List */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Daftar Barang</h3>

            {unitConditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Tidak ada barang yang perlu diperiksa</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unitConditions.map((unit, index) => (
                  <div
                    key={unit.unit_id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500 w-6">
                            {index + 1}.
                          </span>
                          <h4 className="font-medium text-gray-800">
                            {unit.product_name}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          Serial: {unit.serial_number}
                        </p>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded ${
                          unit.condition === "GOOD"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {unit.condition === "GOOD" ? "Baik" : "Rusak"}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-6">
                      <button
                        onClick={() =>
                          handleConditionChange(unit.unit_id, "GOOD")
                        }
                        disabled={isProcessing}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          unit.condition === "GOOD"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Baik
                      </button>
                      <button
                        onClick={() =>
                          handleConditionChange(unit.unit_id, "DAMAGED")
                        }
                        disabled={isProcessing}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          unit.condition === "DAMAGED"
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Rusak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning if all damaged */}
          {damaged === totalUnits && totalUnits > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Semua barang dalam kondisi rusak. Pastikan ini sesuai dengan
                  kondisi sebenarnya.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || unitConditions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Selesaikan Peminjaman
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className="modal-backdrop bg-black/50"
        onClick={isProcessing ? undefined : onClose}
      ></div>
    </div>
  );
}
