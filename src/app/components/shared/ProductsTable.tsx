import { Product } from "@/hooks/useProducts";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const isSuperadmin = pathname === "/superadmin/alatperangkat";

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <table className="table text-gray-700">
          <thead className="bg-gray-200 text-gray-700">
            <tr className="text-black">
              <th className="text-center">No.</th>
              <th className="text-center">Gambar</th>
              <th className="text-center">Nama Produk</th>
              <th className="text-center">Kategori</th>
              <th className="text-center">Jumlah</th>
              <th className="text-center">Ketersediaan</th>
              <th className="text-center">Status</th>
              {!isSuperadmin && <th className="text-center">Aksi</th>}
            </tr>
          </thead>

          <tbody>
            {products.map((product: Product, index: number) => (
              <tr key={product.product_id} className="hover">
                <td className="border-t border-black/10 text-center">
                  {index + 1}
                </td>
                <td className="border-t border-black/10 text-center">
                  <div className="avatar">
                    <div className="mask w-24 h-24 rounded-md">
                      {product.product_image ? (
                        <Image
                          src={product.product_image}
                          width={1000}
                          height={1000}
                          alt={product.product_name || "Product image"}
                        />
                      ) : (
                        <div className="w-[100px] h-[100px] flex items-center justify-center bg-gray-200 text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="border-t border-black/10 text-center">
                  <div className="font-bold">{product.product_name}</div>
                </td>
                <td className="border-t border-black/10 text-center">
                  {product.category?.category_name || "-"}
                </td>
                <td className="border-t border-black/10 text-center">
                  <span>{product.quantity}</span>
                </td>
                <td className="border-t border-black/10 text-center">
                  <span>{product.product_avaible}</span>
                </td>
                <td className="border-t border-black/10 text-center">
                  <span
                    className={`badge border-0 ${
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
                {!isSuperadmin && (
                  <td className="border-t border-black/10 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => onEdit?.(product)}
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
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => onDelete?.(product)}
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
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-2">
        <div className="flex">
          {currentPage} of {totalPages} pages
        </div>
        <div className="flex gap-5">
          <button
            className="join-item btn btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="join-item btn btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
