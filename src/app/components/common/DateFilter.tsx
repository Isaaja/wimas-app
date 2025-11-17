"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  filteredCount: number;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearFilters: () => void;
  formatDateOnly: (date: string) => string;
}

export default function DateFilter({
  startDate,
  endDate,
  filteredCount,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  formatDateOnly,
}: DateFilterProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getDisplayDateRange = () => {
    if (startDate && endDate) {
      return `${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`;
    } else if (startDate) {
      return `Dari ${formatDateOnly(startDate)}`;
    } else if (endDate) {
      return `Sampai ${formatDateOnly(endDate)}`;
    }
    return "Semua Periode";
  };

  const quickFilters = [
    { label: "Hari Ini", days: 0 },
    { label: "7 Hari", days: 7 },
    { label: "30 Hari", days: 30 },
    { label: "Bulan Ini", days: -1 },
  ];

  const applyQuickFilter = (days: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let start = new Date();

    if (days === -1) {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(today);
      start.setDate(today.getDate() - days);
      start.setHours(0, 0, 0, 0);
    }

    onStartDateChange(start.toISOString().split("T")[0]);
    onEndDateChange(end.toISOString().split("T")[0]);
    setShowDatePicker(false);
  };

  const handleClearFilters = () => {
    onClearFilters();
    setShowDatePicker(false);
  };

  return (
    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 shadow-lg">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`btn btn-sm gap-2 ${
              startDate || endDate ? "btn-info" : "btn-outline"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">{getDisplayDateRange()}</span>
            {(startDate || endDate) && (
              <div className="badge badge-sm badge-info">{filteredCount}</div>
            )}
          </button>

          <div className="flex flex-wrap gap-1">
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                onClick={() => applyQuickFilter(filter.days)}
                className="btn btn-xs btn-ghost"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">{filteredCount} data</div>
          {(startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="btn btn-xs btn-ghost text-error"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {showDatePicker && (
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-blue-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium text-gray-600">
                Dari Tanggal
              </label>
              <input
                type="date"
                className="input input-bordered input-sm input-info w-full bg-white"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                max={endDate || undefined}
              />
            </div>

            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium text-gray-600">
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="input input-bordered input-sm input-info w-full bg-white"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-gray-500">
              {startDate && endDate ? (
                <>Menampilkan: {getDisplayDateRange()}</>
              ) : (
                <>Pilih rentang tanggal</>
              )}
            </div>
            <button
              onClick={() => setShowDatePicker(false)}
              className="btn btn-xs btn-ghost"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
