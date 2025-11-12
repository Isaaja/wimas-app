"use client";

import { useState, useEffect } from "react";
import { Loan, getProductUnits } from "@/hooks/useLoans";
import { X, CheckCircle, AlertTriangle, Package, Info } from "lucide-react";

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

  useEffect(() => {
    if (loan && isOpen) {
      const conditions: UnitCondition[] = [];
      const processedUnitIds = new Set<string>();

      loan.items?.forEach((item) => {
        const productUnits = getProductUnits(loan, item.product_id);

        productUnits.forEach((unit) => {
          if (unit.unit_id && !processedUnitIds.has(unit.unit_id)) {
            processedUnitIds.add(unit.unit_id);

            conditions.push({
              unit_id: unit.unit_id,
              serial_number: unit.serial_number || "N/A",
              product_name: item.product_name,
              condition: "GOOD",
            });
          }
        });
      });

      setUnitConditions(conditions);
    }
  }, [loan, isOpen]);

  const getUniqueUnits = (loan: Loan): UnitCondition[] => {
    if (!loan.items) return [];

    const uniqueUnits = new Map<string, UnitCondition>();

    loan.items.forEach((item) => {
      const productUnits = getProductUnits(loan, item.product_id);

      productUnits.forEach((unit) => {
        if (unit.unit_id && !uniqueUnits.has(unit.unit_id)) {
          uniqueUnits.set(unit.unit_id, {
            unit_id: unit.unit_id,
            serial_number: unit.serial_number || "N/A",
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

  const getConditionBadge = (condition: string) => {
    if (condition === "GOOD") {
      return <span className="badge badge-success badge-sm">Baik</span>;
    } else {
      return <span className="badge badge-error badge-sm">Rusak</span>;
    }
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

  useEffect(() => {
    if (unitConditions.length > 0) {
      console.log("Unit Conditions:", unitConditions);
      console.log(
        "Unique unit IDs:",
        unitConditions.map((u) => u.unit_id)
      );
    }
  }, [unitConditions]);

  if (!isOpen || !loan) return null;

  const { good, damaged } = getConditionCount();

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[70vh] flex flex-col bg-white p-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Konfirmasi Penyelesaian Peminjaman
            </h2>
            <p className="text-sm text-gray-500 mt-1">ID: {loan.loan_id}</p>
            <p className="text-xs text-gray-400">
              {unitConditions.length} unit unik ditemukan
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 text-sm mb-2">
                  Informasi Status Unit
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>
                    • <strong>Kondisi BAIK</strong> → Status:{" "}
                    <strong>AVAILABLE</strong>, Condition: <strong>GOOD</strong>
                  </li>
                  <li>
                    • <strong>Kondisi RUSAK</strong> → Status:{" "}
                    <strong>DAMAGED</strong>, Condition:{" "}
                    <strong>DAMAGED</strong>
                  </li>
                  <li>
                    • Unit dengan status <strong>DAMAGED</strong> tidak bisa
                    dipinjam sampai diperbaiki
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base font-semibold mb-3 text-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ringkasan Kondisi Unit
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{good}</div>
                <div className="text-sm text-green-700">Unit Baik</div>
                <div className="text-xs text-green-600 mt-1">
                  Status: AVAILABLE
                  <br />
                  Condition: GOOD
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{damaged}</div>
                <div className="text-sm text-red-700">Unit Rusak</div>
                <div className="text-xs text-red-600 mt-1">
                  Status: DAMAGED
                  <br />
                  Condition: DAMAGED
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base font-semibold mb-4 text-gray-800">
              Kondisi Unit Perangkat ({unitConditions.length} unit unik)
            </h3>

            {unitConditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Tidak ada unit yang perlu diperiksa</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {unitConditions.map((unit) => (
                  <div
                    key={unit.unit_id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {unit.product_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Serial: {unit.serial_number}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {unit.unit_id?.slice(-8)}
                        </p>
                      </div>
                      {getConditionBadge(unit.condition)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleConditionChange(unit.unit_id, "GOOD")
                        }
                        disabled={isProcessing}
                        className={`flex-1 btn btn-sm ${
                          unit.condition === "GOOD"
                            ? "btn-success"
                            : "btn-outline btn-success"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Baik
                      </button>
                      <button
                        onClick={() =>
                          handleConditionChange(unit.unit_id, "DAMAGED")
                        }
                        disabled={isProcessing}
                        className={`flex-1 btn btn-sm ${
                          unit.condition === "DAMAGED"
                            ? "btn-error"
                            : "btn-outline btn-error"
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Rusak
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {unit.condition === "GOOD" ? (
                        <span>
                          ✅ Akan menjadi <strong>AVAILABLE</strong> (siap
                          dipinjam)
                        </span>
                      ) : (
                        <span>
                          ❌ Akan menjadi <strong>DAMAGED</strong> (tidak bisa
                          dipinjam)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {damaged === unitConditions.length && unitConditions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>Perhatian:</strong> Semua unit dalam kondisi rusak.
                  Pastikan ini sesuai dengan kondisi sebenarnya.
                </p>
              </div>
            </div>
          )}
        </div>

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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Konfirmasi Penyelesaian
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
