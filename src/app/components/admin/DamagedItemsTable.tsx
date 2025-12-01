"use client";

import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { Wrench } from "lucide-react";

interface ProductUnit {
  serialNumber: string;
  status?: string;
  condition?: string;
  unit_id?: string;
  product_id?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DamagedItemsTableProps {
  products: Product[];
  onRepair?: (unit: ProductUnit, product: Product) => void;
  onRetire?: (unit: ProductUnit, product: Product) => void;
}

export default function DamagedItemsTable({
  products,
  onRepair,
  onRetire,
}: DamagedItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const damagedItems = products.flatMap((product) =>
    (product.units || [])
      .filter((unit) => unit.condition === "DAMAGED")
      .map((unit) => ({
        ...unit,
        product,
        unit_id: unit.unit_id || `${product.product_id}-${unit.serialNumber}`,
        product_id: unit.product_id || product.product_id,
      }))
  );

  const filteredItems = damagedItems.filter((item) => {
    const matchSearch =
      item.product.product_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const onPageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const totalDamaged = damagedItems.length;

  const getConditionBadge = () => {
    return "badge bg-yellow-100 text-yellow-700 border-yellow-300";
  };

  const getConditionText = () => {
    return "Rusak";
  };

  return (
    <div className="space-y-4 -mt-4 lg:mt-0">
      <div className="lg:bg-white lg:rounded-lg lg:shadow p-0 lg:p-4">
        <div className="flex flex-row gap-4 items-center">
          <div className="lg:flex-1 flex">
            <input
              type="text"
              placeholder="Cari produk atau serial number..."
              className="input input-bordered w-full bg-white border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-primary cursor-default">
              Total Rusak: {totalDamaged}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table text-gray-700 w-full">
            <thead className="bg-gray-200 text-gray-700">
              <tr className="text-black">
                <th className="text-center py-3 px-2">No.</th>
                <th className="text-center py-3 px-2">Gambar</th>
                <th className="text-center py-3 px-2">Nama Produk</th>
                <th className="text-center py-3 px-2">Serial Number</th>
                <th className="text-center py-3 px-2">Kategori</th>
                <th className="text-center py-3 px-2">Kondisi</th>
                <th className="text-center py-3 px-2">Catatan</th>
                <th className="text-center py-3 px-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="font-semibold">Tidak ada barang rusak</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr
                    key={
                      item.unit_id ||
                      `${item.product.product_id}-${item.serialNumber}`
                    }
                    className="hover"
                  >
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      {index + 1}
                    </td>
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      <div className="avatar flex justify-center">
                        <div className="mask w-16 h-16 rounded-md">
                          {item.product.product_image ? (
                            <img
                              src={item.product.product_image}
                              alt={item.product.product_name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      <div className="font-bold text-sm">
                        {item.product.product_name}
                      </div>
                    </td>
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.serialNumber}
                      </code>
                    </td>
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      <span className="text-sm">
                        {item.product.category?.category_name || "-"}
                      </span>
                    </td>
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      <span className={getConditionBadge()}>
                        {getConditionText()}
                      </span>
                    </td>
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      <span className="text-xs text-gray-600">
                        {item.note || "-"}
                      </span>
                    </td>
                    <td className="border-t border-black/10 text-center py-3 px-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="btn btn-ghost btn-sm text-blue-600"
                          onClick={() => onRepair?.(item, item.product)}
                          title="Perbaiki"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-red-600s"
                          onClick={() => onRetire?.(item, item.product)}
                          title="Retire"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-300 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-semibold">Tidak ada barang rusak</p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={
                item.unit_id ||
                `${item.product.product_id}-${item.serialNumber}`
              }
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-5"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    #{index + 1}
                  </div>
                  <div className="avatar">
                    <div className="mask w-14 h-14 rounded-xl border-2 border-white shadow-lg">
                      {item.product.product_image ? (
                        <img
                          src={item.product.product_image}
                          alt={item.product.product_name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-xl">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <span className={getConditionBadge()}>
                  {getConditionText()}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nama Produk
                </div>
                <div className="font-bold text-gray-900 text-lg">
                  {item.product.product_name}
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Serial Number
                  </div>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {item.serialNumber}
                  </code>
                </div>

                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Kategori
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.product.category?.category_name || "-"}
                  </div>
                </div>

                {item.note && (
                  <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      Catatan
                    </div>
                    <div className="text-sm text-gray-700">{item.note}</div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    className="flex-1 btn btn-sm bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => onRepair?.(item, item.product)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Perbaiki
                  </button>
                  <button
                    className="flex-1 btn btn-sm bg-red-500 text-white hover:bg-red-600"
                    onClick={() => onRetire?.(item, item.product)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Retire
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          <div className="text-sm text-gray-600">
            <span className="text-sm">
              Hal {currentPage} dari {totalPages}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>

            <button
              className="btn btn-sm btn-outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
