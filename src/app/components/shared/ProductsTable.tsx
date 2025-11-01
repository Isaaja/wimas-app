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
                      {product.product_avaible}
                    </span>
                  </td>
                  <td className="border-t border-black/10 text-center py-3 px-2">
                    <span
                      className={`badge border-0 text-xs lg:text-sm ${
                        product.product_avaible === 0
                          ? "bg-[#FF8282] text-[#740938]"
                          : "bg-[#B8F1B0] text-[#215B63]"
                      }`}
                    >
                      {product.product_avaible === 0
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
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-500">
                  #{index + 1}
                </div>
                <div className="avatar">
                  <div className="mask w-12 h-12 rounded-md">
                    {product.product_image ? (
                      <Image
                        src={product.product_image}
                        width={48}
                        height={48}
                        alt={product.product_name || "Product image"}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  className="btn btn-ghost btn-xs p-1"
                  onClick={() => onEdit?.(product)}
                  title="Edit"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-ghost btn-xs p-1 text-error"
                  onClick={() => onDelete?.(product)}
                  title="Hapus"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-sm font-semibold text-gray-700">
                  Nama Produk
                </div>
                <div className="font-bold text-gray-900 truncate">
                  {product.product_name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Kategori
                  </div>
                  <div className="text-gray-900">
                    {product.category?.category_name || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Jumlah
                  </div>
                  <div className="text-gray-900">{product.quantity}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Ketersediaan
                  </div>
                  <div className="text-gray-900">{product.product_avaible}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Status
                  </div>
                  <span
                    className={`badge border-0 text-xs ${
                      product.product_avaible === 0
                        ? "bg-[#FF8282] text-[#740938]"
                        : "bg-[#B8F1B0] text-[#215B63]"
                    }`}
                  >
                    {product.product_avaible === 0
                      ? "Tidak Tersedia"
                      : "Tersedia"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
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
            className="join-item btn btn-sm btn-primary px-4"
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
