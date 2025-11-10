"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Hash,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";

interface ProductUnit {
  unit_id: string;
  serialNumber: string;
  status: string;
  product_id: string;
}

interface UnitSelection {
  product_id: string;
  product_name: string;
  required_quantity: number;
  selected_units: string[];
  available_units: ProductUnit[];
}

interface UnitSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanItems: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
  onApprove: (
    unitAssignments: Array<{ product_id: string; unit_ids: string[] }>
  ) => void;
  isSubmitting?: boolean;
}

export default function UnitSelectionModal({
  isOpen,
  onClose,
  loanItems,
  onApprove,
  isSubmitting = false,
}: UnitSelectionModalProps) {
  const [unitSelections, setUnitSelections] = useState<UnitSelection[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Fetch available units ketika modal dibuka
  useEffect(() => {
    if (isOpen && loanItems.length > 0) {
      fetchAllAvailableUnits();
    }
  }, [isOpen, loanItems]);

  const fetchAllAvailableUnits = async () => {
    if (!loanItems.length) return;

    setIsLoadingUnits(true);
    try {
      const unitsPromises = loanItems.map(async (item) => {
        try {
          const response = await fetch(
            `/api/products/${item.product_id}/units?status=AVAILABLE`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch units for ${item.product_id}`);
          }
          const data = await response.json();
          return { productId: item.product_id, units: data.data || [] };
        } catch (error) {
          console.error(
            `Error fetching units for product ${item.product_id}:`,
            error
          );
          return { productId: item.product_id, units: [] };
        }
      });

      const results = await Promise.all(unitsPromises);
      const unitsMap = results.reduce((acc, result) => {
        acc[result.productId] = result.units;
        return acc;
      }, {} as Record<string, ProductUnit[]>);

      // Set unit selections
      const selections: UnitSelection[] = loanItems.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        required_quantity: item.quantity,
        selected_units: [],
        available_units: unitsMap[item.product_id] || [],
      }));

      setUnitSelections(selections);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Gagal memuat unit perangkat");
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleRefreshUnits = async () => {
    await fetchAllAvailableUnits();
    toast.success("Data unit berhasil diperbarui");
  };

  const handleResetUnitSelections = () => {
    setUnitSelections((prev) =>
      prev.map((selection) => ({
        ...selection,
        selected_units: [],
      }))
    );
    toast.info("Semua pilihan unit telah direset");
  };

  const toggleUnitSelection = (productId: string, unitId: string) => {
    setUnitSelections((prev) =>
      prev.map((selection) => {
        if (selection.product_id !== productId) return selection;

        const isSelected = selection.selected_units.includes(unitId);
        const newSelected = isSelected
          ? selection.selected_units.filter((id) => id !== unitId)
          : selection.selected_units.length < selection.required_quantity
          ? [...selection.selected_units, unitId]
          : selection.selected_units;

        return {
          ...selection,
          selected_units: newSelected,
        };
      })
    );
  };

  const handleSubmitApproval = () => {
    if (unitSelections.length === 0) {
      toast.error("Tidak ada barang yang akan disetujui");
      return;
    }

    const incomplete = unitSelections.find(
      (s) => s.selected_units.length !== s.required_quantity
    );

    if (incomplete) {
      toast.error(
        `Pilih tepat ${incomplete.required_quantity} unit untuk ${incomplete.product_name} (Terpilih: ${incomplete.selected_units.length})`
      );
      return;
    }

    const unitAssignments = unitSelections.map((selection) => ({
      product_id: selection.product_id,
      unit_ids: selection.selected_units,
    }));

    onApprove(unitAssignments);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[85vh] p-0 flex flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Pilih Nomor Serial Perangkat
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Pilih unit spesifik untuk setiap perangkat yang akan dipinjam
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshUnits}
              disabled={isLoadingUnits || isSubmitting}
              className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Refresh unit tersedia"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-600 ${
                  isLoadingUnits ? "animate-spin" : ""
                }`}
              />
            </button>

            <button
              onClick={handleResetUnitSelections}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Reset semua pilihan"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {isLoadingUnits ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg text-info"></span>
              <p className="text-sm text-gray-500 mt-3">
                Memuat unit perangkat yang tersedia...
              </p>
            </div>
          ) : (
            unitSelections.map((selection) => (
              <div
                key={selection.product_id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {selection.product_name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Pilih {selection.required_quantity} unit •{" "}
                      <span
                        className={
                          selection.selected_units.length ===
                          selection.required_quantity
                            ? "text-green-600 font-medium"
                            : "text-orange-600"
                        }
                      >
                        {selection.selected_units.length} terpilih
                      </span>
                    </p>
                  </div>
                  {selection.selected_units.length ===
                    selection.required_quantity && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>

                {selection.available_units.length === 0 ? (
                  <div className="text-center py-8 bg-red-50 rounded border border-red-200">
                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-700 font-medium">
                      Tidak ada unit tersedia
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Stok perangkat ini habis
                    </p>
                  </div>
                ) : selection.available_units.length <
                  selection.required_quantity ? (
                  <div className="mb-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Stok tidak mencukupi: Tersedia{" "}
                      {selection.available_units.length} unit, dibutuhkan{" "}
                      {selection.required_quantity} unit
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {selection.available_units.map((unit) => {
                    const isSelected = selection.selected_units.includes(
                      unit.unit_id
                    );
                    const isDisabled =
                      !isSelected &&
                      selection.selected_units.length >=
                        selection.required_quantity;

                    return (
                      <button
                        key={unit.unit_id}
                        onClick={() =>
                          toggleUnitSelection(
                            selection.product_id,
                            unit.unit_id
                          )
                        }
                        disabled={isDisabled || isSubmitting}
                        className={`flex items-center gap-2 p-3 rounded border-2 transition-all text-left ${
                          isSelected
                            ? "border-green-500 bg-green-50"
                            : isDisabled
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "border-green-600 bg-green-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-gray-400" />
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {unit.serialNumber}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {unit.unit_id}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="text-xs text-gray-600">
            {unitSelections.every(
              (s) => s.selected_units.length === s.required_quantity
            ) ? (
              <span className="text-green-600 font-medium">
                ✓ Semua unit telah dipilih
              </span>
            ) : (
              <span className="text-orange-600">
                Pilih unit untuk semua perangkat
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitApproval}
              disabled={
                isSubmitting ||
                !unitSelections.every(
                  (s) => s.selected_units.length === s.required_quantity
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Setujui Peminjaman
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
