import { Product } from "@/hooks/useProducts";
import Image from "next/image";

interface ProductTableProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPageChange: (page: number) => void;
}

export default function ProductsTable({
  products,
  currentPage,
  totalPages,
  onEdit,
  onDelete,
  onPageChange,
}: ProductTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table text-gray-700 w-full">
            <thead className="bg-gray-200 text-gray-700">
              <tr className="text-black">
                <th className="text-center py-3 px-2">No.</th>
                <th className="text-center py-3 px-2">Gambar</th>
                <th className="text-center py-3 px-2">Nama Produk</th>
                <th className="text-center py-3 px-2">Kategori</th>
                <th className="text-center py-3 px-2">Jumlah</th>
                <th className="text-center py-3 px-2">Ketersediaan</th>
                <th className="text-center py-3 px-2">Status</th>
                <th className="text-center py-3 px-2">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product: Product, index: number) => (
                <tr key={product.product_id} className="hover">
                  <td className="border-t border-black/10 text-center py-3 px-2">
                    {index + 1}
                  </td>
                  <td className="border-t border-black/10 text-center py-3 px-2">
                    <div className="avatar flex justify-center">
                      <div className="mask w-16 h-16 lg:w-20 lg:h-20 rounded-md">
                        {product.product_image ? (
                          <Image
                            src={product.product_image}
                            width={80}
                            height={80}
                            alt={product.product_name || "Product image"}
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
                    <div className="font-bold text-sm lg:text-base max-w-[150px] lg:max-w-[200px] truncate mx-auto">
                      {product.product_name}
                    </div>
                  </td>
                  <td className="border-t border-black/10 text-center py-3 px-2">
                    <span className="text-sm lg:text-base">
                      {product.category?.category_name || "-"}
                    </span>
                  </td>
                  <td className="border-t border-black/10 text-center py-3 px-2">
                    <span className="text-sm lg:text-base">
                      {product.quantity}
                    </span>
                  </td>
                  <td className="border-t border-black/10 text-center py-3 px-2">
                    <span className="text-sm lg:text-base">
                      {product.product_available}
                    </span>
                  </td>
                  <td className="border-t border-black/10 text-center py-3 px-2">
                    <span
                      className={`badge border-0 text-xs lg:text-sm ${
                        product.product_available === 0
                          ? "bg-[#FF8282] text-[#740938]"
                          : "bg-[#B8F1B0] text-[#215B63]"
                      }`}
                    >
                      {product.product_available === 0
                        ? "Tidak Tersedia"
                        : "Tersedia"}
                    </span>
                  </td>

                  <td className="border-t border-black/10 text-center py-3 px-2">
                    <div className="flex gap-1 lg:gap-2 justify-center">
                      <button
                        className="btn btn-ghost btn-xs lg:btn-sm p-1 lg:p-2"
                        onClick={() => onEdit?.(product)}
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-3 h-3 lg:w-4 lg:h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        className="btn btn-ghost btn-xs lg:btn-sm p-1 lg:p-2 text-error"
                        onClick={() => onDelete?.(product)}
                        title="Hapus"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-3 h-3 lg:w-4 lg:h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {products.map((product: Product, index: number) => (
          <div
            key={product.product_id}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shadow-lg">
                    #{index + 1}
                  </div>
                </div>
                <div className="avatar">
                  <div className="mask w-14 h-14 rounded-xl border-2 border-white shadow-lg">
                    {product.product_image ? (
                      <Image
                        src={product.product_image}
                        width={56}
                        height={56}
                        alt={product.product_name || "Product image"}
                        className="object-cover w-full h-full rounded-xl"
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

              <div className="flex gap-2">
                <button
                  className="btn btn-circle btn-sm bg-white/80 backdrop-blur-sm  hover:bg-blue-50 border-blue-300 text-blue-600 transition-all duration-200 shadow-sm"
                  onClick={() => onEdit?.(product)}
                  title="Edit"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-circle btn-sm bg-white/80 backdrop-blur-sm  hover:bg-red-50 border-red-300 text-red-600 transition-all duration-200 shadow-sm"
                  onClick={() => onDelete?.(product)}
                  title="Hapus"
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
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Nama Produk
              </div>
              <div className="font-bold text-gray-900 text-lg truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                {product.product_name}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Kategori
                  </div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    {product.category?.category_name || "-"}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Jumlah
                  </div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-500"
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
                    {product.quantity}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Ketersediaan
                  </div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-purple-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    {product.product_available}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Status
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      product.product_available === 0
                        ? "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200"
                        : "bg-gradient-to-r from-green-100 to-emerald-50 text-green-700 border border-green-200"
                    }`}
                  >
                    {product.product_available === 0 ? (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Tidak Tersedia
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Tersedia
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 mb-10">
        <div className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            className="join-item btn btn-sm btn-outline px-4"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Sebelumnya
          </button>
          <button
            className="join-item btn btn-sm px-4"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </>
  );
}
