"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLoanById, getProductUnits } from "@/hooks/useLoans";
import Loading from "@/app/components/common/Loading";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Download, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";

export default function AdminNotaPeminjamanPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.loanId as string;
  const { data: loan, isLoading, error } = useLoanById(loanId);
  const notaRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMMM yyyy", { locale: id });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, HH:mm", { locale: id });
  };

  const getProductUnitsWithSerial = (productId: string) => {
    if (!loan) return [];
    return getProductUnits(loan, productId);
  };

  const getUniqueProducts = () => {
    if (!loan?.items) return [];

    const productMap = new Map();

    loan.items.forEach((item) => {
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, {
          ...item,
          totalQuantity: loan.items.filter(
            (i) => i.product_id === item.product_id
          ).length,
        });
      }
    });

    return Array.from(productMap.values());
  };

  const getAllLoanUnits = () => {
    if (!loan?.items) return [];

    const allUnits: any[] = [];
    const processedUnitIds = new Set<string>();

    loan.items.forEach((item) => {
      const productUnits = getProductUnitsWithSerial(item.product_id);

      productUnits.forEach((unit) => {
        if (unit.unit_id && !processedUnitIds.has(unit.unit_id)) {
          processedUnitIds.add(unit.unit_id);
          allUnits.push({
            ...unit,
            product_name: item.product_name,
            product_id: item.product_id,
          });
        }
      });
    });

    return allUnits;
  };

  // Fungsi baru untuk mendapatkan serial numbers dalam format koma
  const getSerialNumbersFormatted = (productId: string) => {
    const productUnits = getProductUnitsWithSerial(productId);
    const uniqueProductUnits = productUnits.filter(
      (unit, index, self) =>
        index === self.findIndex((u) => u.unit_id === unit.unit_id)
    );

    const serialNumbers = uniqueProductUnits
      .map((unit) => unit.serial_number || "N/A")
      .filter((serial) => serial !== "N/A");

    return serialNumbers.length > 0 ? serialNumbers.join(", ") : "N/A";
  };

  const handlePrint = useReactToPrint({
    contentRef: notaRef,
    documentTitle:
      loan?.status === "RETURNED"
        ? `nota-pengembalian-${loanId}`
        : `nota-peminjaman-${loanId}`,
    onBeforePrint: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
        @page {
          size: ${isLandscape ? "landscape" : "portrait"};
          margin: 0.2in;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          html, body {
            height: 100%;
          }
        }
      `,
  });

  const downloadPDF = async () => {
    setIsPrinting(true);
    try {
      await handlePrint();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal mengunduh PDF");
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !loan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            {error?.message || "Data peminjaman tidak ditemukan"}
          </p>
          <Link href="/admin/peminjam" className="btn btn-primary">
            Kembali ke Daftar Peminjaman
          </Link>
        </div>
      </div>
    );
  }

  const isReturned = loan.status === "RETURNED" || loan.status === "DONE";
  const notaTitle = isReturned ? "NOTA PENGEMBALIAN" : "NOTA PEMINJAMAN";
  const headerTitle = isReturned
    ? "Nota Pengembalian - Admin"
    : "Nota Peminjaman - Admin";

  const owner = loan.invited_users?.find((p: any) => p.role === "OWNER");
  const invitedUsers = loan.invited_users?.filter(
    (p: any) => p.role === "INVITED"
  );

  const totalItems =
    loan.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  const uniqueProducts = getUniqueProducts();
  const allUnits = getAllLoanUnits();

  return (
    <div className="">
      <div className="border-b no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isReturned ? (
                <Link href="/admin/riwayat" className="btn btn-ghost btn-sm">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </Link>
              ) : (
                <Link href="/admin/peminjam" className="btn btn-ghost btn-sm">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </Link>
              )}
              <h1 className="text-xl font-bold text-gray-800">{headerTitle}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="btn btn-outline btn-sm"
                disabled={isPrinting}
              >
                <Printer className="w-4 h-4" />
                {isPrinting ? "Mencetak..." : "Print/PDF"}
              </button>
              <button
                onClick={downloadPDF}
                className="btn btn-primary btn-sm"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nota Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div
          ref={notaRef}
          className={`bg-white shadow-lg rounded-lg border p-4 mx-auto print:shadow-none print:border-0 print:rounded-none ${
            isLandscape
              ? "w-full max-w-6xl print-fit-landscape"
              : "w-full max-w-4xl print-fit-portrait"
          }`}
          style={{
            fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif",
            fontSize: "12px",
          }}
        >
          {/* Kop Surat */}
          <div className="border-b border-gray-300 pb-2 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-0">
                  {notaTitle}
                </h1>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">WISMA APP</div>
                <p className="text-gray-600 text-sm">
                  Sistem Manajemen Peminjaman
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-3">
            {/* Informasi Peminjaman */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-1 text-sm">
                  INFORMASI {isReturned ? "PENGEMBALIAN" : "PEMINJAM"}
                </h3>
                <div className="space-y-0.5 text-sm">
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-16">
                      Nama:
                    </span>
                    <span className="text-gray-800 flex-1">
                      {loan.borrower.name || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-0.5 text-sm">
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-20">
                      Status:
                    </span>
                    <span
                      className="badge text-sm px-2 py-0.5"
                      style={{
                        backgroundColor:
                          loan.status === "APPROVED"
                            ? "#d1fae5"
                            : loan.status === "RETURNED"
                            ? "#dbeafe"
                            : loan.status === "DONE"
                            ? "#f3e8ff"
                            : "#fef3c7",
                        color:
                          loan.status === "APPROVED"
                            ? "#065f46"
                            : loan.status === "RETURNED"
                            ? "#1e40af"
                            : loan.status === "DONE"
                            ? "#6b21a8"
                            : "#92400e",
                        border: "1px solid",
                        borderColor:
                          loan.status === "APPROVED"
                            ? "#a7f3d0"
                            : loan.status === "RETURNED"
                            ? "#93c5fd"
                            : loan.status === "DONE"
                            ? "#d8b4fe"
                            : "#fcd34d",
                      }}
                    >
                      {loan.status === "APPROVED"
                        ? "Disetujui"
                        : loan.status === "RETURNED"
                        ? "Dikembalikan"
                        : loan.status === "DONE"
                        ? "Selesai"
                        : loan.status}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-20">
                      {isReturned ? "Tanggal Kembali:" : "Tanggal Pinjam:"}
                    </span>
                    <span className="text-gray-800 flex-1">
                      {formatDateTime(loan.updated_at)}
                    </span>
                  </div>
                  {!isReturned && loan.created_at && (
                    <div className="flex">
                      <span className="font-medium text-gray-600 w-20">
                        Tanggal Pinjam:
                      </span>
                      <span className="text-gray-800 flex-1">
                        {formatDateTime(loan.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informasi SPT */}
            {loan.report && (
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-gray-700 mb-1 text-sm">
                  SURAT PERINTAH TUGAS (SPT)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-16">
                      No. SPT:
                    </span>
                    <span className="text-gray-800 flex-1">
                      {loan.report.spt_number}
                    </span>
                  </div>
                  <div className="md:col-span-3 flex">
                    <span className="font-medium text-gray-600 w-16">
                      Tujuan:
                    </span>
                    <span className="text-gray-800 flex-1">
                      {loan.report.destination}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-16">
                      Tanggal Mulai:
                    </span>
                    <span className="text-gray-800 flex-1">
                      {formatDate(loan.report.start_date)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-16">
                      Tanggal Selesai:
                    </span>
                    <span className="text-gray-800 flex-1">
                      {formatDate(loan.report.end_date)}
                    </span>
                  </div>
                  {loan.report.place_of_execution && (
                    <div className="md:col-span-4 flex">
                      <span className="font-medium text-gray-600 w-16">
                        Tempat:
                      </span>
                      <span className="text-gray-800 flex-1">
                        {loan.report.place_of_execution}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Daftar Barang */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">
                {isReturned
                  ? "BARANG YANG DIKEMBALIKAN"
                  : "BARANG YANG DIPINJAM"}
                ({totalItems} items, {allUnits.length} unit)
              </h3>

              {uniqueProducts.map((product: any, productIndex: number) => {
                const serialNumbersFormatted = getSerialNumbersFormatted(
                  product.product_id
                );

                return (
                  <div key={product.product_id} className="mb-2 last:mb-0">
                    <div className="bg-gray-50 p-2 border border-gray-300 rounded">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">
                            {productIndex + 1}. {product.product_name}
                          </div>

                          {/* Serial Numbers dalam format koma */}
                          <div className="mt-1">
                            <div className="text-xs text-gray-700">
                              <span className="font-medium">Serial: </span>
                              {serialNumbersFormatted}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 whitespace-nowrap ml-2">
                          {product.totalQuantity} unit
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daftar Peserta Undangan */}
            {invitedUsers && invitedUsers.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1 text-sm">
                  PESERTA UNDANGAN ({invitedUsers.length} orang)
                </h3>
                <div className="text-sm text-gray-600">
                  <div
                    className="flex flex-col flex-wrap max-h-24 gap-1"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flexWrap: "wrap",
                      maxHeight: "96px",
                      gap: "2px 16px",
                    }}
                  >
                    {invitedUsers.map((participant: any, index: number) => (
                      <div
                        key={participant.id}
                        className="flex"
                        style={{ width: "20%" }}
                      >
                        <span className="w-5 flex-shrink-0">{index + 1}.</span>
                        <span className="truncate">
                          {participant.user?.name ||
                            participant.user?.username ||
                            "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Daftar Invited Users (jika ada) */}
            {loan.invited_users && loan.invited_users.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1 text-sm">
                  USERS YANG DIUNDANG ({loan.invited_users.length} orang)
                </h3>
                <div className="text-sm text-gray-600">
                  <div
                    className="flex flex-col flex-wrap max-h-24 gap-1"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flexWrap: "wrap",
                      maxHeight: "96px",
                      gap: "2px 16px",
                    }}
                  >
                    {loan.invited_users.map((user: any, index: number) => (
                      <div
                        key={user.user_id}
                        className="flex"
                        style={{ width: "20%" }}
                      >
                        <span className="w-5 flex-shrink-0">{index + 1}.</span>
                        <span className="truncate">
                          {user.name || user.username}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-300 pt-2 mt-3">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-600">
                    Dicetak pada:{" "}
                    {new Date().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Sistem WISMA APP</p>
                  <p className="text-gray-500 text-sm">
                    {isReturned
                      ? "Nota ini sah dan dapat digunakan sebagai bukti pengembalian"
                      : "Nota ini sah dan dapat digunakan sebagai bukti peminjaman"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS untuk Print */}
      <style jsx>{`
        @media print {
          @page {
            size: ${isLandscape ? "landscape" : "portrait"};
            margin: 0.2in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-fit-landscape,
          .print-fit-portrait {
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          /* Pastikan konten tidak terpotong */
          .print-fit-landscape {
            min-height: auto !important;
            max-height: none !important;
          }
          .print-fit-portrait {
            min-height: auto !important;
            max-height: none !important;
          }
        }

        /* Untuk tampilan di browser saja */
        .print-fit-landscape {
          min-height: auto;
        }

        .print-fit-portrait {
          min-height: auto;
        }
      `}</style>
    </div>
  );
}
