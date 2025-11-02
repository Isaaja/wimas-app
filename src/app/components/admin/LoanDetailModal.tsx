"use client";

import { useState, useEffect } from "react";
import {
  Loan,
  LoanProduct,
  useUpdateLoanItems,
  useLoanById,
} from "@/hooks/useLoans";
import { useProducts, Product } from "@/hooks/useProducts";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  X,
  Edit,
  Save,
  Download,
  Plus,
  Search,
  UserPen,
  Users,
  Box,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LoanDetailModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onNota: (loanId: string) => void;
  onApprove?: (loanId: string) => void;
  onReject?: (loanId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  onDataUpdated?: () => void;
}

export default function LoanDetailModal({
  loan,
  isOpen,
  onClose,
  onApprove,
  onNota,
  onReject,
  isApproving = false,
  isRejecting = false,
  onDataUpdated,
}: LoanDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<LoanProduct[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldFetchLatest, setShouldFetchLatest] = useState(false);
  const router = useRouter();

  const {
    data: latestLoan,
    isLoading: loanLoading,
    refetch: refetchLoan,
  } = useLoanById(shouldFetchLatest && loan?.loan_id ? loan.loan_id : "");

  const { mutate: updateLoanItems, isPending: isUpdating } =
    useUpdateLoanItems();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  useEffect(() => {
    if (isOpen && loan?.loan_id) {
      setShouldFetchLatest(true);
    } else {
      setShouldFetchLatest(false);
    }
  }, [isOpen, loan?.loan_id]);

  useEffect(() => {
    if (latestLoan && Array.isArray(latestLoan.items)) {
      setEditedItems([...latestLoan.items]);
    } else if (loan && Array.isArray(loan.items)) {
      setEditedItems([...loan.items]);
    } else {
      setEditedItems([]);
    }
  }, [loan, latestLoan]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
  };

  const handleEditClick = () => {
    const currentItems =
      latestLoan && Array.isArray(latestLoan.items)
        ? [...latestLoan.items]
        : loan && Array.isArray(loan.items)
        ? [...loan.items]
        : [];

    setEditedItems(currentItems);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (loan) {
      const itemsToUpdate = editedItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      updateLoanItems(
        { loanId: loan.loan_id, items: itemsToUpdate },
        {
          onSuccess: () => {
            setIsEditing(false);
            setShowAddProduct(false);
            refetchLoan();
            toast.success("Berhasil mengubah perangkat yang dipinjam");
            onDataUpdated?.();
          },
          onError: (error) => {
            toast.error("Gagal mengubah perangkat yang dipinjam");
          },
        }
      );
    }
  };

  const handleCancelEdit = () => {
    const currentItems =
      latestLoan && Array.isArray(latestLoan.items)
        ? [...latestLoan.items]
        : loan && Array.isArray(loan.items)
        ? [...loan.items]
        : [];

    setEditedItems(currentItems);
    setIsEditing(false);
    setShowAddProduct(false);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setEditedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setEditedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addProduct = (product: Product) => {
    const existingItemIndex = editedItems.findIndex(
      (item) => item.product_id === product.product_id
    );

    if (existingItemIndex >= 0) {
      updateItemQuantity(
        existingItemIndex,
        editedItems[existingItemIndex].quantity + 1
      );
    } else {
      const newItem: LoanProduct = {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: 1,
        loan_item_id: `temp-${Date.now()}`,
      };
      setEditedItems((prev) => [...prev, newItem]);
    }
    setShowAddProduct(false);
    setSearchTerm("");
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

  const filteredProducts = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.product_avaible > 0
  );

  const selectedProductIds = editedItems.map((item) => item.product_id);
  const availableProducts = filteredProducts.filter(
    (product) => !selectedProductIds.includes(product.product_id)
  );

  if (!isOpen || !loan) return null;

  const displayLoan = loan;
  const currentItems = isEditing
    ? editedItems
    : latestLoan && Array.isArray(latestLoan.items)
    ? latestLoan.items
    : loan && Array.isArray(loan.items)
    ? loan.items
    : [];

  const sptFileUrl = displayLoan.report
    ? getSptFileUrl(displayLoan.report.spt_file)
    : null;
  const ownerName =
    displayLoan.owner?.name || displayLoan.owner?.username || "-";
  const borrowerName =
    displayLoan.borrower?.name || displayLoan.borrower?.username || "-";
  const invitedUsers = displayLoan.invited_users || [];

  return (
    <div className="modal modal-open">
      <div className="modal-box p-0 max-w-2xl max-h-[80vh] flex flex-col bg-white border border-gray-200 mt-14">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Detail Peminjaman
            </h2>
            {loanLoading && (
              <div className="flex items-center gap-1 mt-1">
                <span className="loading loading-spinner loading-xs text-info"></span>
                <span className="text-xs text-info">
                  Memperbarui data perangkat...
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div className="flex justify-between items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex gap-2 items-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  displayLoan.status === "REQUESTED"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : displayLoan.status === "APPROVED"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : displayLoan.status === "REJECTED"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : displayLoan.status === "RETURNED"
                    ? "bg-red-100 text-indigo-500- border border-indigo-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {displayLoan.status === "REQUESTED"
                  ? "Menunggu"
                  : displayLoan.status === "APPROVED"
                  ? "Disetujui"
                  : displayLoan.status === "REJECTED"
                  ? "Ditolak"
                  : displayLoan.status === "RETURNED"
                  ? "Dikembalikan"
                  : "Selesai"}
              </span>
              <span className="text-xs text-gray-600">
                {formatDate(displayLoan.updated_at)}
              </span>
            </div>
            {loan.status === "APPROVED" && (
              <div className="flex">
                <Link
                  href={`/admin/nota/${loan.loan_id}`}
                  className="btn btn-ghost btn-xs text-green-600"
                >
                  <FileText className="w-4 h-4" />
                  Nota Peminjaman
                </Link>
              </div>
            )}
            {(loan.status === "RETURNED" || loan.status === "DONE") && (
              <div className="flex">
                <Link
                  href={`/admin/nota/${loan.loan_id}`}
                  className="btn btn-ghost btn-xs text-yellow-600"
                >
                  <FileText className="w-4 h-4" />
                  Nota Pengembalian
                </Link>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="flex gap-2 items-center text-xs text-gray-500 font-medium">
                <UserPen className="w-4 h-4" color="black" />
                <label>Peminjam</label>
              </div>
              <p className="text-sm text-gray-800 font-medium mt-1">
                {borrowerName}
              </p>
            </div>
          </div>

          {/* Participants */}
          {invitedUsers.length > 0 && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex gap-2 text-xs text-gray-500 font-medium">
                <Users className="w-4 h-4" color="black" />
                <label className=" mb-2 block">
                  Pengguna Diundang ({invitedUsers.length})
                </label>
              </div>
              <div className="flex flex-wrap gap-1">
                {invitedUsers.map((user) => (
                  <span
                    key={user.user_id}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300"
                  >
                    {user.name || user.username || user.user_id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Items Section */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <Box className="w-4 h-4" color="black" />
                <label className="text-xs text-gray-500 font-medium">
                  Perangkat ({currentItems.length})
                  {isUpdating && (
                    <span className="ml-2 text-orange-500">(Menyimpan...)</span>
                  )}
                  {loanLoading && (
                    <span className="ml-2 text-blue-500">(Memperbarui...)</span>
                  )}
                </label>
              </div>
              {displayLoan.status === "REQUESTED" &&
                !isEditing &&
                !isUpdating && (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium border border-blue-200 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit Perangkat
                  </button>
                )}
            </div>

            {/* Edit Mode Controls */}
            {isEditing && (
              <div className="mb-3">
                {!showAddProduct ? (
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Perangkat
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari perangkat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {productsLoading ? (
                      <div className="text-center py-4">
                        <span className="loading loading-spinner loading-sm text-info"></span>
                        <p className="text-xs text-gray-500 mt-1">
                          Memuat produk...
                        </p>
                      </div>
                    ) : availableProducts.length > 0 ? (
                      <div className="max-h-32 overflow-y-auto border border-blue-200 rounded">
                        {availableProducts.map((product) => (
                          <button
                            key={product.product_id}
                            onClick={() => addProduct(product)}
                            className="w-full text-left p-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {product.product_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Stok: {product.product_avaible}
                                </p>
                              </div>
                              <Plus className="w-3 h-3 text-blue-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">
                        {searchTerm
                          ? "Produk tidak ditemukan"
                          : "Semua produk sudah dipilih"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2">
              {currentItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Tidak ada barang yang dipinjam
                </p>
              ) : (
                currentItems.map((item, index) => (
                  <div
                    key={item.loan_item_id || `${item.product_id}-${index}`}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.product_name}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white border border-gray-300 rounded">
                          <button
                            onClick={() =>
                              updateItemQuantity(index, item.quantity - 1)
                            }
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateItemQuantity(index, item.quantity + 1)
                            }
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs border border-red-200 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium border border-blue-200">
                        {item.quantity}x
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Report */}
          {displayLoan.report && (
            <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
              <div className="flex gap-2 text-xs text-gray-500 font-medium ">
                <Mail className="w-4 h-4" color="black" />
                <label className="block">Informasi SPT</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">No. SPT</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {displayLoan.report.spt_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tujuan</p>
                  <p className="text-sm text-gray-800 line-clamp-3">
                    {displayLoan.report.destination}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tempat Pelaksanaan</p>
                  <p className="text-sm text-gray-800">
                    {displayLoan.report.place_of_execution}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tempat Pelaksanaan</p>
                  <p className="text-sm text-gray-800">
                    {formatDate(displayLoan.report.end_date)}
                  </p>
                </div>
                {sptFileUrl && (
                  <div className="col-span-2">
                    <a
                      href={sptFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                    >
                      <Download className="w-3 h-3" />
                      Download SPT
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Dibuat:</span>{" "}
              {formatDate(displayLoan.created_at)}
            </p>
            <p>
              <span className="font-medium">Diupdate:</span>{" "}
              {formatDate(displayLoan.updated_at)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-white gap-2">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveClick}
                  disabled={isUpdating}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isUpdating ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  {isUpdating ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Batal
                </button>
              </>
            ) : (
              displayLoan.status === "REQUESTED" &&
              !isUpdating && (
                <button
                  onClick={() => onApprove?.(displayLoan.loan_id)}
                  disabled={isApproving}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isApproving ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Setujui"
                  )}
                </button>
              )
            )}
          </div>

          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
