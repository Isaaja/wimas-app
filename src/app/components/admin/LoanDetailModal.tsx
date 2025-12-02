"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  X,
  Download,
  User,
  Users,
  Package,
  FileText,
  Calendar,
  Hash,
  CheckCircle,
  Copy,
  Edit,
  Save,
  Plus,
  Search,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  Loan,
  LoanProduct,
  useUpdateLoanItems,
  useLoanById,
  useApproveLoanWithUnits,
  getProductQuantities,
  getUniqueProducts,
  hasUnitAssignments,
  getProductUnits,
  productHasUnits,
} from "@/hooks/useLoans";
import { useProducts, Product } from "@/hooks/useProducts";
import { getAvailableCount } from "@/lib/productUtils";
import { toast } from "react-toastify";
import Link from "next/link";

interface LoanDetailModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onNota: (loanId: string) => void;
  onApprove?: (
    loanId: string,
    units?: Array<{ product_id: string; unit_ids: string[] }>
  ) => void;
  onReject?: (loanId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  onDataUpdated?: () => void;
}

type EditingItem = any;

export default function LoanDetailModal({
  loan,
  isOpen,
  onClose,
  onNota,
  onApprove,
  onReject,
  isApproving: externalIsApproving = false,
  isRejecting = false,
  onDataUpdated,
}: LoanDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<EditingItem[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldFetchLatest, setShouldFetchLatest] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [unitsCache, setUnitsCache] = useState<Record<string, any[]>>({});
  const [copiedUnitId, setCopiedUnitId] = useState<string | null>(null);
  const [addingProducts, setAddingProducts] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (isEditing && editedItems.length > 0) {
      loadAvailableUnitsForAll(editedItems);
    }
  }, [isEditing]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const {
    data: latestLoan,
    isLoading: loanLoading,
    refetch: refetchLoan,
  } = useLoanById(shouldFetchLatest && loan?.loan_id ? loan.loan_id : "");

  const { mutate: updateLoanItems, isPending: isUpdating } =
    useUpdateLoanItems();
  const { mutate: approveLoanWithUnits, isPending: isSubmittingApproval } =
    useApproveLoanWithUnits();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  useEffect(() => {
    const currentLoan = latestLoan || loan;
    if (currentLoan && Array.isArray(currentLoan.items) && !isEditing) {
      const items = currentLoan.items.map((item: any) => ({
        ...item,
        selected_units: [],
        available_units: unitsCache[item.product_id] || [],
      }));
      setEditedItems(items);
    }
  }, [loan, latestLoan, isEditing]);

  useEffect(() => {
    if (isOpen && loan?.loan_id) {
      setShouldFetchLatest(true);
    } else {
      setShouldFetchLatest(false);
    }
  }, [isOpen, loan?.loan_id]);

  const getCurrentItems = (): LoanProduct[] => {
    const currentLoan = latestLoan || loan;
    if (currentLoan && Array.isArray(currentLoan.items)) {
      return currentLoan.items;
    }
    return [];
  };

  const isApproving = isSubmittingApproval || externalIsApproving;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy", { locale: id });
  };

  const getSptFileUrl = (sptFile: string | null | undefined): string | null => {
    if (!sptFile) return null;

    // Jika sudah full URL
    if (sptFile.startsWith("http")) return sptFile;

    // Jika path relatif namun sudah di dalam "uploads/"
    if (sptFile.startsWith("uploads/")) {
      return `/uploads/spt/${sptFile.replace("uploads/", "")}`;
    }

    // Jika berasal dari public/
    if (sptFile.startsWith("public/")) {
      const cleaned = sptFile.replace("public/", "").replace("uploads/", "");
      return `/uploads/spt/${cleaned}`;
    }

    // Jika dimulai dari /
    if (sptFile.startsWith("/")) {
      const cleaned = sptFile.replace("/", "").replace("uploads/", "");
      return `/uploads/spt/${cleaned}`;
    }

    // Default (nama file biasa)
    return `/uploads/spt/${sptFile}`;
  };

  const getAccessToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("accessToken") ||
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1] ||
      null
    );
  };

  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers[key] = value as string;
        });
      }
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    return response;
  };

  const copyToClipboard = async (text: string, unitId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUnitId(unitId);
      setTimeout(() => setCopiedUnitId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const loadAvailableUnitsForAll = async (items: any[]) => {
    setIsLoadingUnits(true);
    try {
      const updatedCache: Record<string, any[]> = { ...unitsCache };

      await Promise.all(
        items.map(async (item) => {
          try {
            const response = await fetchWithToken(
              `/api/products/${item.product_id}/units?status=AVAILABLE`
            );
            if (!response.ok) throw new Error(`Failed to fetch units`);
            const data = await response.json();
            updatedCache[item.product_id] = data.data || [];
          } catch (error) {
            console.error(
              `Error fetching units for product ${item.product_id}:`,
              error
            );
            updatedCache[item.product_id] = [];
          }
        })
      );

      setUnitsCache(updatedCache);
      setEditedItems((prev) =>
        prev.map((item) => ({
          ...item,
          available_units: updatedCache[item.product_id] || [],
        }))
      );
    } catch (error) {
      console.error("Error loading units:", error);
      toast.error("Gagal memuat unit perangkat");
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleEditClick = async () => {
    const currentItems = getCurrentItems();
    const itemsWithUnits = currentItems.map((item: any) => ({
      ...item,
      selected_units: [],
      available_units: unitsCache[item.product_id] || [],
    }));

    setEditedItems(itemsWithUnits);
    setIsEditing(true);
    await loadAvailableUnitsForAll(itemsWithUnits);
  };

  const refreshUnitsForProduct = async (productId: string) => {
    setIsLoadingUnits(true);
    try {
      const response = await fetchWithToken(
        `/api/products/${productId}/units?status=AVAILABLE`
      );
      if (!response.ok) throw new Error(`Failed to fetch units`);
      const data = await response.json();

      const updatedCache = {
        ...unitsCache,
        [productId]: data.data || [],
      };

      setUnitsCache(updatedCache);
      setEditedItems((prev) =>
        prev.map((item) =>
          item.product_id === productId
            ? { ...item, available_units: data.data || [] }
            : item
        )
      );
      toast.success("Unit berhasil diperbarui");
    } catch (error) {
      console.error(`Error refreshing units for product ${productId}:`, error);
      toast.error("Gagal memuat unit perangkat");
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleSaveClick = () => {
    if (!loan) return;

    if (editedItems.length === 0) {
      toast.error("Minimal harus ada 1 perangkat yang dipinjam");
      return;
    }

    // Validasi stock untuk semua items
    for (const item of editedItems) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) {
        toast.error(`Produk ${item.product_name} tidak ditemukan`);
        return;
      }

      if (item.quantity > getAvailableCount(product)) {
        toast.error(
          `Stok ${product.product_name} tidak mencukupi. Dibutuhkan: ${
            item.quantity
          }, Stok tersedia: ${getAvailableCount(product)}`
        );
        return;
      }
    }

    const itemsToUpdate = editedItems.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    // SIMPAN SEMUA PERUBAHAN (quantity updates & removals)
    updateLoanItems(
      {
        loanId: loan.loan_id,
        items: itemsToUpdate,
      },
      {
        onSuccess: () => {
          toast.success("Berhasil mengubah perangkat yang dipinjam");
          setShowAddProduct(false);
          setIsEditing(false);
          refetchLoan();
          onDataUpdated?.();

          // Reset states
          setExpandedProduct(null);
          setUnitsCache({});
        },
        onError: (error) => {
          console.error("Error updating loan items:", error);
          toast.error(
            error.message || "Gagal mengubah perangkat yang dipinjam"
          );
        },
      }
    );
  };

  const handleCancelEdit = () => {
    const currentItems = getCurrentItems();
    const resetItems = currentItems.map((item: any) => ({
      ...item,
      selected_units: [],
      available_units: [],
    }));
    setEditedItems(resetItems);
    setIsEditing(false);
    setShowAddProduct(false);
    setExpandedProduct(null);
    setUnitsCache({});
    setSearchTerm("");

    toast.info("Perubahan dibatalkan");
  };

  const toggleUnitSelection = (productId: string, unitId: string) => {
    setEditedItems((prev: any) =>
      prev.map((item: any) => {
        if (item.product_id !== productId) return item;

        const isSelected = item.selected_units.includes(unitId);
        const newSelected = isSelected
          ? item.selected_units.filter((id: string) => id !== unitId)
          : item.selected_units.length < item.quantity
          ? [...item.selected_units, unitId]
          : item.selected_units;

        return { ...item, selected_units: newSelected };
      })
    );
  };

  const handleApproveWithUnits = () => {
    if (!loan) return;

    if (editedItems.length === 0) {
      toast.error("Tidak ada barang yang dipinjam");
      return;
    }

    const incomplete = editedItems.find(
      (item: any) => item.selected_units.length !== item.quantity
    );

    if (incomplete) {
      toast.error(
        `❌ Pilih tepat ${incomplete.quantity} unit untuk ${incomplete.product_name} (Terpilih: ${incomplete.selected_units.length})`
      );
      return;
    }

    const unitAssignments = editedItems.map((item: any) => ({
      product_id: item.product_id,
      unit_ids: item.selected_units,
    }));

    approveLoanWithUnits(
      { loanId: loan.loan_id, units: unitAssignments },
      {
        onSuccess: () => {
          toast.success("Peminjaman berhasil disetujui dengan unit terpilih!");
          setIsEditing(false);
          setExpandedProduct(null);
          setUnitsCache({});
          refetchLoan();
          onDataUpdated?.();
          onClose();
        },
        onError: (error: Error) => {
          console.error("❌ Approval error:", error);
          toast.error(error.message || "Gagal menyetujui peminjaman");
        },
      }
    );
  };

  const toggleProductExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      toast.error("Quantity minimal 1");
      return;
    }

    const item = editedItems[index];
    const product = products.find((p) => p.product_id === item.product_id);

    if (!product) {
      toast.error("Produk tidak ditemukan");
      return;
    }

    if (newQuantity > getAvailableCount(product)) {
      toast.error(
        `Stok ${
          product.product_name
        } tidak mencukupi. Stok tersedia: ${getAvailableCount(product)}`
      );
      return;
    }

    setEditedItems((prev: any) => {
      return prev.map((item: any, i: number) =>
        i === index
          ? {
              ...item,
              quantity: newQuantity,
              selected_units: item.selected_units.slice(0, newQuantity),
            }
          : item
      );
    });
  };

  const removeItem = (index: number) => {
    const itemToRemove = editedItems[index];

    setEditedItems((prev: any) =>
      prev.filter((_: any, i: number) => i !== index)
    );

    const removedProductId = itemToRemove?.product_id;
    if (removedProductId === expandedProduct) {
      setExpandedProduct(null);
    }
  };

  const addProduct = async (product: Product) => {
    if (!loan) return;

    if (displayLoan.status !== "REQUESTED") {
      toast.error("Hanya bisa mengedit peminjaman dengan status REQUESTED");
      return;
    }

    if (getAvailableCount(product) <= 0) {
      toast.error(`Stok ${product.product_name} habis, tidak bisa ditambahkan`);
      return;
    }

    setAddingProducts((prev) => ({ ...prev, [product.product_id]: true }));

    try {
      const existingItemIndex = editedItems.findIndex(
        (item: any) => item.product_id === product.product_id
      );

      let updatedItems: any[];

      if (existingItemIndex >= 0) {
        const currentQuantity = editedItems[existingItemIndex].quantity;
        const availableStock = getAvailableCount(product);

        if (currentQuantity >= availableStock) {
          toast.error(
            `Stok ${product.product_name} tidak mencukupi. Stok tersedia: ${availableStock}`
          );
          return;
        }

        updatedItems = editedItems.map((item: any, i: number) =>
          i === existingItemIndex
            ? {
                ...item,
                quantity: currentQuantity + 1,
                selected_units: [],
              }
            : item
        );
      } else {
        const newItem = {
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: 1,
          loan_item_id: `temp-${Date.now()}`,
          selected_units: [],
          available_units: unitsCache[product.product_id] || [],
        };
        updatedItems = [...editedItems, newItem];
      }

      const itemsToUpdate = updatedItems.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      await updateLoanItems(
        { loanId: loan.loan_id, items: itemsToUpdate },
        {
          onSuccess: async () => {
            const message =
              existingItemIndex >= 0
                ? `Berhasil menambah quantity ${product.product_name}`
                : `Berhasil menambahkan ${product.product_name}`;
            toast.success(message);

            setEditedItems(updatedItems);
            setShowAddProduct(false);
            setSearchTerm("");

            await refetchLoan();
            onDataUpdated?.();

            if (existingItemIndex < 0 && !unitsCache[product.product_id]) {
              await loadSingleProductUnits(product.product_id);
            }

            if (existingItemIndex < 0) {
              setExpandedProduct(product.product_id);
            }
          },
          onError: (error) => {
            console.error("Error adding product:", error);
            toast.error(error.message || "Gagal menambahkan perangkat");
          },
        }
      );
    } catch (error) {
      console.error("Error in addProduct:", error);
      toast.error("Gagal menambahkan perangkat");
    } finally {
      setAddingProducts((prev) => ({ ...prev, [product.product_id]: false }));
    }
  };

  const loadSingleProductUnits = async (productId: string) => {
    try {
      const response = await fetchWithToken(
        `/api/products/${productId}/units?status=AVAILABLE`
      );
      if (!response.ok) throw new Error(`Failed to fetch units`);
      const data = await response.json();

      const updatedCache = {
        ...unitsCache,
        [productId]: data.data || [],
      };

      setUnitsCache(updatedCache);
      setEditedItems((prev: any) =>
        prev.map((item: any) =>
          item.product_id === productId
            ? { ...item, available_units: data.data || [] }
            : item
        )
      );
    } catch (error) {
      console.error(`Error loading units for product ${productId}:`, error);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      getAvailableCount(product) > 0
  );

  const selectedProductIds = editedItems.map((item: any) => item.product_id);
  const availableProducts = filteredProducts.filter(
    (product) => !selectedProductIds.includes(product.product_id)
  );

  const allItemsHaveUnits = editedItems.every(
    (item: any) => item.selected_units?.length === item.quantity
  );

  const hasItemsWithoutUnits = editedItems.some(
    (item: any) => (item.selected_units?.length || 0) !== item.quantity
  );

  if (!isVisible || !loan) return null;

  const displayLoan = latestLoan || loan;
  const itemsToDisplay = isEditing ? editedItems : getCurrentItems();

  const sptFileUrl = getSptFileUrl(displayLoan.report?.spt_file);
  const hasUnits = hasUnitAssignments(displayLoan);
  const productQuantities = getProductQuantities(displayLoan);
  const uniqueProducts = getUniqueProducts(displayLoan);
  const invitedUsers = displayLoan.invited_users || [];
  const items = displayLoan.items || [];

  const borrowerName =
    displayLoan.borrower?.name || displayLoan.borrower?.username || "Unknown";

  return (
    <div className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box p-0 max-w-4xl max-h-[85vh] flex flex-col bg-white border border-gray-200 mt-12">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Detail Peminjaman {isEditing && "- Mode Edit & Pilih Unit"}
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
            disabled={isUpdating || isApproving}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  displayLoan.status === "REQUESTED"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : displayLoan.status === "APPROVED"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : displayLoan.status === "REJECTED"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : displayLoan.status === "RETURNED"
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
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
            {(displayLoan.status === "APPROVED" ||
              displayLoan.status === "RETURNED" ||
              displayLoan.status === "DONE") && (
              <div className="flex">
                <Link
                  href={`/admin/nota/${displayLoan.loan_id}`}
                  className="btn btn-ghost btn-xs text-green-600"
                >
                  <FileText className="w-4 h-4" />
                  Lihat Nota
                </Link>
              </div>
            )}
          </div>

          {isEditing && hasItemsWithoutUnits && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Perhatian: Ada perangkat yang belum dipilih unitnya
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Anda harus memilih unit untuk semua perangkat sebelum dapat
                  menyetujui peminjaman.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-500 font-medium">
                  Peminjam Utama
                </label>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Nama</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {borrowerName}
                  </p>
                </div>
              </div>
            </div>

            {invitedUsers.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-600" />
                  <label className="text-xs text-gray-500 font-medium">
                    Peserta Lain ({invitedUsers.length})
                  </label>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {invitedUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="px-3 py-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {user.name || user.username || "Unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex flex-col lg:flex-row items-center lg:justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-500 font-medium">
                  Perangkat ({uniqueProducts.length} jenis, {items.length}{" "}
                  total)
                  {isUpdating && (
                    <span className="ml-2 text-orange-500">(Menyimpan...)</span>
                  )}
                  {loanLoading && (
                    <span className="ml-2 text-blue-500">(Memperbarui...)</span>
                  )}
                  {isLoadingUnits && (
                    <span className="ml-2 text-blue-500">(Memuat unit...)</span>
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
                    <Edit className="w-3 h-3" /> Edit Perangkat & Pilih Unit
                  </button>
                )}
            </div>

            {isEditing && (
              <div className="mb-3">
                {!showAddProduct ? (
                  <button
                    onClick={() => setShowAddProduct(true)}
                    disabled={isUpdating}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" /> Tambah Perangkat
                  </button>
                ) : (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-blue-800">
                        Tambah Perangkat Baru
                      </h4>
                      <button
                        onClick={() => {
                          setShowAddProduct(false);
                          setSearchTerm("");
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-blue-600" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari perangkat berdasarkan nama..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {productsLoading ? (
                      <div className="text-center py-4">
                        <span className="loading loading-spinner loading-sm text-blue-500"></span>
                        <p className="text-xs text-gray-500 mt-1">
                          Memuat produk...
                        </p>
                      </div>
                    ) : availableProducts.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto border border-blue-200 rounded bg-white">
                        {availableProducts.map((product) => (
                          <button
                            key={product.product_id}
                            onClick={() => addProduct(product)}
                            disabled={
                              getAvailableCount(product) <= 0 ||
                              addingProducts[product.product_id] ||
                              isUpdating
                            }
                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {product.product_name}
                                  </p>
                                  {getAvailableCount(product) <= 0 && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                      Stok Habis
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>
                                    Stok: {getAvailableCount(product)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                {addingProducts[product.product_id] ? (
                                  <span className="text-xs text-blue-600">
                                    Menambah...
                                  </span>
                                ) : getAvailableCount(product) > 0 ? (
                                  <>
                                    <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-xs text-blue-600 font-medium">
                                      Tambah
                                    </span>
                                  </>
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded border">
                        {searchTerm ? (
                          <div className="space-y-1">
                            <Search className="w-6 h-6 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">
                              Produk tidak ditemukan
                            </p>
                            <p className="text-xs text-gray-500">
                              Tidak ada produk yang cocok dengan {searchTerm}
                            </p>
                            <button
                              onClick={() => setSearchTerm("")}
                              className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                            >
                              Tampilkan semua produk
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Package className="w-6 h-6 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">
                              Semua produk sudah dipilih
                            </p>
                            <p className="text-xs text-gray-500">
                              Tidak ada produk lain yang bisa ditambahkan
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {availableProducts.length > 0 && (
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Menampilkan {availableProducts.length} produk tersedia
                        </span>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Hapus pencarian
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {itemsToDisplay.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Tidak ada barang yang dipinjam
                </div>
              ) : (
                itemsToDisplay
                  .filter(
                    (item, index, self) =>
                      index ===
                      self.findIndex((t) => t.product_id === item.product_id)
                  )
                  .map((item: any, index: number) => {
                    const quantity = productQuantities[item.product_id] || 0;
                    const productUnits = getProductUnits(
                      displayLoan,
                      item.product_id
                    );
                    const hasAssignedUnits = productHasUnits(
                      displayLoan,
                      item.product_id
                    );

                    const uniqueKey = `${item.product_id}-${
                      item.loan_item_id || index
                    }-${Date.now()}`;

                    return (
                      <div
                        key={uniqueKey}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-50 p-3 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.product_image ? (
                                <div className="w-10 h-10 relative rounded border border-gray-300">
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover rounded"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {item.product_name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {quantity} unit
                                  {hasAssignedUnits &&
                                    ` • ${productUnits.length} unit assigned`}
                                  {isEditing && (
                                    <span className="ml-2">
                                      •{" "}
                                      <span
                                        className={
                                          item.selected_units?.length ===
                                          item.quantity
                                            ? "text-green-600 font-medium"
                                            : "text-orange-600"
                                        }
                                      >
                                        {item.selected_units?.length || 0}{" "}
                                        terpilih
                                      </span>
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <div className="flex items-center gap-1 bg-white border border-gray-300 rounded">
                                    <button
                                      onClick={() =>
                                        updateItemQuantity(
                                          index,
                                          item.quantity - 1
                                        )
                                      }
                                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                      disabled={
                                        item.quantity <= 1 || isUpdating
                                      }
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center text-sm font-medium text-gray-800">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateItemQuantity(
                                          index,
                                          item.quantity + 1
                                        )
                                      }
                                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                                      disabled={isUpdating}
                                    >
                                      +
                                    </button>
                                  </div>

                                  <button
                                    onClick={() =>
                                      toggleProductExpand(item.product_id)
                                    }
                                    disabled={isUpdating}
                                    className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs border border-blue-200 transition-colors disabled:opacity-50"
                                  >
                                    {expandedProduct === item.product_id ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                    Pilih Unit
                                  </button>

                                  <button
                                    onClick={() => removeItem(index)}
                                    disabled={isUpdating}
                                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs border border-red-200 transition-colors disabled:opacity-50"
                                  >
                                    Hapus
                                  </button>
                                </>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {quantity}x
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {(displayLoan.status !== "REQUESTED" || isEditing) && (
                          <div className="p-3 bg-white">
                            <div className="flex items-center gap-2 mb-3">
                              <Hash className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-medium text-gray-700">
                                Detail Unit ({productUnits.length} unit):
                              </span>
                              {isEditing &&
                                expandedProduct === item.product_id && (
                                  <button
                                    onClick={() =>
                                      refreshUnitsForProduct(item.product_id)
                                    }
                                    disabled={isLoadingUnits}
                                    className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs border border-green-200 transition-colors disabled:opacity-50 ml-auto"
                                  >
                                    <RefreshCw
                                      className={`w-3 h-3 ${
                                        isLoadingUnits ? "animate-spin" : ""
                                      }`}
                                    />
                                    Refresh Unit
                                  </button>
                                )}
                            </div>

                            {isEditing &&
                            expandedProduct === item.product_id ? (
                              <>
                                {item.available_units?.length === 0 ? (
                                  <div className="text-center py-4 bg-red-50 rounded border border-red-200">
                                    <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                    <p className="text-sm text-red-700 font-medium">
                                      Tidak ada unit tersedia
                                    </p>
                                    <p className="text-xs text-red-600 mt-1">
                                      Stok perangkat ini habis
                                    </p>
                                  </div>
                                ) : item.available_units?.length <
                                  item.quantity ? (
                                  <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <p className="text-xs text-yellow-800">
                                      ⚠️ Stok tidak mencukupi: Tersedia{" "}
                                      {item.available_units?.length} unit,
                                      dibutuhkan {item.quantity} unit
                                    </p>
                                  </div>
                                ) : null}

                                {item.available_units?.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {item.available_units.map((unit: any) => {
                                      const isSelected =
                                        item.selected_units?.includes(
                                          unit.unit_id
                                        );
                                      const isDisabled =
                                        !isSelected &&
                                        (item.selected_units?.length || 0) >=
                                          item.quantity;

                                      return (
                                        <button
                                          key={unit.unit_id}
                                          onClick={() =>
                                            toggleUnitSelection(
                                              item.product_id,
                                              unit.unit_id
                                            )
                                          }
                                          disabled={isDisabled}
                                          className={`flex items-center gap-2 p-2 rounded border-2 transition-all text-left ${
                                            isSelected
                                              ? "border-green-500 bg-green-50"
                                              : isDisabled
                                              ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                                          }`}
                                        >
                                          <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                              isSelected
                                                ? "border-green-600 bg-green-600"
                                                : "border-gray-300 bg-white"
                                            }`}
                                          >
                                            {isSelected && (
                                              <svg
                                                className="w-2 h-2 text-white"
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
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            ) : (
                              !isEditing && (
                                <div className="space-y-2">
                                  {productUnits.map(
                                    (unit: any, unitIndex: any) => (
                                      <div
                                        key={unit.unit_id}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                            <span className="text-sm text-gray-700">
                                              Serial:{" "}
                                              <span className="font-mono">
                                                {unit.serial_number || "N/A"}
                                              </span>
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                          Unit #{unitIndex + 1}
                                        </div>
                                      </div>
                                    )
                                  )}

                                  {productUnits.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">
                                      <span className="text-xs">
                                        {displayLoan.status === "REQUESTED"
                                          ? `Menunggu persetujuan dan penugasan ${quantity} unit`
                                          : "Belum ada unit yang ditugaskan untuk produk ini"}
                                      </span>
                                    </div>
                                  )}

                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-gray-600">
                                        Total Unit:
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          productUnits.length === quantity
                                            ? "text-green-600"
                                            : productUnits.length > quantity
                                            ? "text-blue-600"
                                            : "text-orange-600"
                                        }`}
                                      >
                                        {productUnits.length} dari {quantity}{" "}
                                        unit
                                      </span>
                                    </div>
                                    {productUnits.length < quantity && (
                                      <div className="mt-1 text-xs text-orange-600">
                                        ⚠️ {quantity - productUnits.length} unit
                                        belum ditugaskan
                                      </div>
                                    )}
                                    {productUnits.length > quantity && (
                                      <div className="mt-1 text-xs text-blue-600">
                                        ℹ️ Lebih banyak unit yang ditugaskan
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {displayLoan.report && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-500 font-medium">
                  Informasi SPT
                </label>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">No. SPT</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {displayLoan.report.spt_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tujuan</p>
                    <p className="text-sm text-gray-800">
                      {displayLoan.report.destination}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Tempat Pelaksanaan</p>
                  <p className="text-sm text-gray-800">
                    {displayLoan.report.place_of_execution}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Tanggal Mulai</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDateOnly(displayLoan.report.start_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tanggal Selesai</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDateOnly(displayLoan.report.end_date)}
                    </p>
                  </div>
                </div>

                {sptFileUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <a
                      href={sptFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download SPT
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-600" />
              <label className="text-xs text-gray-500 font-medium">
                Informasi Waktu
              </label>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Dibuat:</span>
                <span>{formatDate(displayLoan.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Diupdate:</span>
                <span>{formatDate(displayLoan.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-white sticky bottom-0 gap-2">
          <div className="flex gap-2 flex-wrap">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveClick}
                  disabled={isUpdating}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Simpan Perubahan
                    </>
                  )}
                </button>

                <button
                  onClick={handleApproveWithUnits}
                  disabled={
                    isApproving ||
                    isLoadingUnits ||
                    !allItemsHaveUnits ||
                    editedItems.length === 0
                  }
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                  title={
                    !allItemsHaveUnits
                      ? "Pilih unit untuk semua perangkat terlebih dahulu"
                      : "Setujui peminjaman dengan unit yang dipilih"
                  }
                >
                  {isApproving ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Setujui Peminjaman
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating || isApproving}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Batal
                </button>
              </>
            ) : (
              displayLoan.status === "REQUESTED" &&
              !isUpdating && (
                <button
                  onClick={handleEditClick}
                  disabled={isApproving}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Edit className="w-3 h-3" /> Edit Perangkat
                </button>
              )
            )}
          </div>

          <button
            onClick={onClose}
            disabled={isUpdating || isApproving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
