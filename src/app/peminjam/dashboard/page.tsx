"use client";

import Loading from "@/app/components/common/Loading";
import { useCheckUserLoan } from "@/hooks/useLoans";
import { useFilteredLoanHistory } from "@/hooks/useLoans";
import { useLoanHistory } from "@/hooks/useLoans";
import { useProducts } from "@/hooks/useProducts";
import {
  Clock,
  Package,
  History,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  ClipboardList,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useMemo } from "react";
import StatCard from "@/app/components/common/StatCard";
import Badge from "@/app/components/common/Badge";

interface LoanTrendData {
  month: string;
  loans: number;
}

interface LoanStatusData {
  status: string;
  count: number;
  color: string;
}

interface PopularProductData {
  name: string;
  count: number;
}

export default function BorrowerDashboard() {
  const { data: checkResult, isLoading: isLoadingCheck } = useCheckUserLoan();
  const { loans: activeLoans, isLoading: isLoadingActive } =
    useFilteredLoanHistory("active");
  const { data: loanHistory, isLoading: isLoadingHistory } = useLoanHistory();
  const { data: products = [] } = useProducts();

  const canBorrow = checkResult?.canBorrow ?? true;
  const totalActiveLoans = activeLoans.length;
  const totalProducts = products.length;
  const recentLoans = loanHistory?.loans?.slice(0, 5) || [];

  const loanTrendData = useMemo((): LoanTrendData[] => {
    if (!loanHistory?.loans) return [];

    const last6Months: LoanTrendData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("id-ID", { month: "short" });
      last6Months.push({ month: monthKey, loans: 0 });
    }

    loanHistory.loans.forEach((loan) => {
      const loanDate = new Date(loan.created_at);
      const monthKey = loanDate.toLocaleDateString("id-ID", { month: "short" });

      const monthData = last6Months.find((m) => m.month === monthKey);
      if (monthData) {
        monthData.loans += 1;
      }
    });

    return last6Months;
  }, [loanHistory]);

  const loanStatusData = useMemo((): LoanStatusData[] => {
    if (!loanHistory?.loans) return [];

    const statusCount = {
      REQUESTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      RETURNED: 0,
    };

    loanHistory.loans.forEach((loan) => {
      statusCount[loan.status] = (statusCount[loan.status] || 0) + 1;
    });

    return [
      {
        status: "Disetujui",
        count: statusCount.APPROVED,
        color: "#10b981",
      },
      {
        status: "Ditolak",
        count: statusCount.REJECTED,
        color: "#ef4444",
      },
      {
        status: "Dikembalikan",
        count: statusCount.RETURNED,
        color: "#3b82f6",
      },
      {
        status: "Menunggu",
        count: statusCount.REQUESTED,
        color: "#f59e0b",
      },
    ].filter((item) => item.count > 0);
  }, [loanHistory]);

  const successRate = useMemo(() => {
    if (!loanHistory?.loans || loanHistory.loans.length === 0) return 0;

    const successfulLoans = loanHistory.loans.filter(
      (loan) => loan.status === "APPROVED" || loan.status === "RETURNED"
    ).length;

    return Math.round((successfulLoans / loanHistory.loans.length) * 100);
  }, [loanHistory]);

  const popularProductsData = useMemo((): PopularProductData[] => {
    if (!loanHistory?.loans) return [];

    const productUsage = new Map<string, PopularProductData>();

    loanHistory.loans.forEach((loan) => {
      loan.items?.forEach((item) => {
        const productId = item.product_id;
        const productName = item.product_name || "Unknown Product";
        const currentCount = productUsage.get(productId) || {
          name: productName,
          count: 0,
        };
        currentCount.count += item.quantity || 1;
        productUsage.set(productId, currentCount);
      });
    });

    return Array.from(productUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [loanHistory]);

  if (isLoadingCheck || isLoadingActive || isLoadingHistory) {
    return <Loading />;
  }

  return (
    <div className="min-h-fit p-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Status dan Peminjaman Aktif - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
          <div
            className={`flex justify-start items-center rounded-lg px-8 shadow-lg border ${
              canBorrow
                ? "bg-gradient-to-r from-green-100 to-green-200 border-green-200"
                : "bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300"
            }`}
          >
            <div className="flex items-center gap-4">
              {canBorrow ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-lg truncate">
                  {canBorrow ? "Bisa Meminjam" : "Tidak Bisa Meminjam"}
                </h3>
                <div className="text-md text-gray-600 truncate">
                  {checkResult?.reason}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Borrow Button */}
          <div className="bg-white rounded-lg shadow-lg border border-blue-100">
            <div className="p-2 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Peminjaman Aktif
                </h2>
                <div className="flex items-center justify-center">
                  <Badge color="bg-blue-100 text-blue-800 text-sm">
                    {activeLoans.length}
                  </Badge>
                  <div className="p-2 border-t border-blue-100">
                    <Link
                      href="/peminjam/peminjaman"
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors block text-center"
                    >
                      Lihat Semua
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {activeLoans.length === 0 ? (
                  <p className="text-gray-500 text-center py-2 text-xs">
                    Tidak ada peminjaman aktif
                  </p>
                ) : (
                  activeLoans.slice(0, 4).map((loan) => (
                    <div
                      key={loan.loan_id}
                      className="flex justify-between items-center p-1 bg-blue-50 rounded border border-blue-100 hover:bg-blue-100 transition-colors text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">
                          {loan.items?.length || 0} items
                        </div>
                        <div className="text-gray-500 truncate">
                          {new Date(loan.created_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                      {loan.status === "APPROVED" ? (
                        <Badge color="bg-green-100 text-green-800 text-xs">
                          Disetujui
                        </Badge>
                      ) : (
                        <Badge color="bg-yellow-100 text-yellow-800 text-xs">
                          Menunggu
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Super Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <StatCard
            icon={Clock}
            title="Peminjaman Aktif"
            value={totalActiveLoans}
            subtitle="Aktif"
            color="blue"
            compact
          />

          <StatCard
            icon={Package}
            title="Perangkat"
            value={totalProducts}
            subtitle="Tersedia"
            color="green"
            compact
          />

          <StatCard
            icon={History}
            title="Riwayat"
            value={loanHistory?.total || 0}
            subtitle="Total"
            color="purple"
            compact
          />

          <StatCard
            icon={TrendingUp}
            title="Success"
            value={`${successRate}%`}
            subtitle="Rate"
            color="orange"
            compact
          />
        </div>

        {/* Charts Section - More Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow-lg border border-blue-100 p-2">
            <div className="flex items-center gap-1 mb-2">
              <BarChart3 className="w-3 h-3 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-xs">
                Trend 6 Bulan
              </h3>
            </div>
            <div className="h-36">
              {loanTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loanTrendData}>
                    <XAxis dataKey="month" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="loans"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 1, r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                  Belum ada data
                </div>
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg border border-blue-100 p-2">
            <div className="flex items-center gap-1 mb-2">
              <Calendar className="w-3 h-3 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-xs">
                Status Peminjaman
              </h3>
            </div>
            <div className="h-36">
              {loanStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loanStatusData}>
                    <XAxis dataKey="status" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {loanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                  Belum ada data
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {/* Recent History */}
          <div className="bg-white rounded-lg shadow border border-blue-100">
            <div className="p-2 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                  <History className="w-4 h-4 text-blue-600" />
                  Riwayat Terbaru
                </h2>
                <Badge color="bg-purple-100 text-purple-800 text-xs">
                  {recentLoans.length}
                </Badge>
              </div>
            </div>
            <div className="p-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {recentLoans.length === 0 ? (
                  <p className="text-gray-500 text-center py-2 text-sm">
                    Belum ada riwayat
                  </p>
                ) : (
                  recentLoans.map((loan) => (
                    <div
                      key={loan.loan_id}
                      className="flex justify-between items-center p-1 bg-blue-50 rounded border border-blue-100 hover:bg-blue-100 transition-colors text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">
                          {loan.items?.length || 0} items
                        </div>
                        <div className="text-gray-500 truncate">
                          {new Date(loan.created_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                      {loan.status === "RETURNED" ? (
                        <Badge color="bg-green-100 text-green-800 text-xs">
                          Kembali
                        </Badge>
                      ) : loan.status === "REJECTED" ? (
                        <Badge color="bg-red-100 text-red-800 text-xs">
                          Ditolak
                        </Badge>
                      ) : (
                        <Badge color="bg-yellow-100 text-yellow-800 text-xs">
                          Menunggu
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-2 border-t border-blue-100">
              <Link
                href="/peminjam/riwayat"
                className="bg-white border border-blue-600 text-blue-600 px-2 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors block text-center"
              >
                Lihat Riwayat
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg border border-blue-100 p-3">
            <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Aksi Cepat
            </h2>
            <div className="flex gap-2 flex-col">
              <Link
                href="/peminjam/alatperangkat"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-1 justify-start transition-all group ${
                  !canBorrow
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed disabled:pointer-events-none"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105"
                }`}
              >
                <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-xs">Pinjam</span>
              </Link>

              <Link
                href="/peminjam/peminjaman"
                className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 justify-start bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 shadow-sm hover:shadow-md hover:scale-105 transition-all group"
              >
                <ClipboardList className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-xs">Peminjaman</span>
              </Link>

              <Link
                href="/peminjam/riwayat"
                className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 justify-start bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 text-purple-700 shadow-sm hover:shadow-md hover:scale-105 transition-all group"
              >
                <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-xs">Riwayat</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
