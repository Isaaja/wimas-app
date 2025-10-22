"use client";

import { useMemo } from "react";
import { useDashboardStats } from "@/hooks/useDashboard";
import Loading from "@/app/components/common/Loading";
import {
  Package,
  Users,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart3,
  Calendar,
} from "lucide-react";
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

export default function AdminDashboard() {
  const { data, isLoading, isError, error } = useDashboardStats();

  const stats = data?.stats || {
    totalProducts: 0,
    totalUsers: 0,
    totalLoans: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalAvailableProducts: 0,
    pendingLoans: 0,
    approvedLoans: 0,
    rejectedLoans: 0,
    returnedLoans: 0,
    adminUsers: 0,
    borrowerUsers: 0,
    recentLoans: 0,
  };

  const allLoans = useMemo(() => data?.allLoans || [], [data?.allLoans]);
  const lowStockProductsList = data?.lowStockProducts || [];
  const pendingLoansList = data?.pendingLoans || [];

  const loanTrendData = useMemo((): LoanTrendData[] => {
    if (!allLoans || allLoans.length === 0) return [];

    const last6Months: LoanTrendData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("id-ID", { month: "short" });
      last6Months.push({ month: monthKey, loans: 0 });
    }

    allLoans.forEach((loan) => {
      const loanDate = new Date(loan.created_at);
      const monthKey = loanDate.toLocaleDateString("id-ID", { month: "short" });

      const monthData = last6Months.find((m) => m.month === monthKey);
      if (monthData) {
        monthData.loans += 1;
      }
    });

    return last6Months;
  }, [allLoans]);

  const loanStatusData = useMemo((): LoanStatusData[] => {
    if (!allLoans || allLoans.length === 0) return [];

    const statusCount: Record<string, number> = {
      REQUESTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      RETURNED: 0,
    };

    allLoans.forEach((loan) => {
      const status = loan.status.toUpperCase();
      statusCount[status] = (statusCount[status] || 0) + 1;
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
  }, [allLoans]);

  const popularProductsData = useMemo((): PopularProductData[] => {
    if (!allLoans || allLoans.length === 0) return [];

    const productUsage = new Map<string, PopularProductData>();

    allLoans.forEach((loan) => {
      loan.items?.forEach((item) => {
        const productId = item.product_id;
        const productName = item.product?.product_name || "Unknown Product";
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
  }, [allLoans]);

  const pendingLoans = pendingLoansList;
  const lowStockProducts = lowStockProductsList;

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="p-4">
        <div className="alert alert-error">
          <span>Error: {error?.message || "Gagal memuat data dashboard"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-fit p-4">
      <div className="max-w-7xl mx-auto">
        {/* Stat Cards - Compact Layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={Package}
            title="Total Produk"
            value={stats.totalProducts}
            subtitle={`${stats.totalAvailableProducts} tersedia`}
            color="blue"
            compact
          />

          <StatCard
            icon={Users}
            title="Total Pengguna"
            value={stats.totalUsers}
            subtitle={`${stats.adminUsers} admin, ${stats.borrowerUsers} peminjam`}
            color="green"
            compact
          />

          <StatCard
            icon={ClipboardList}
            title="Total Peminjaman"
            value={stats.totalLoans}
            subtitle={`${stats.recentLoans} minggu ini`}
            color="purple"
            compact
          />

          <StatCard
            icon={AlertTriangle}
            title="Perhatian"
            value={stats.pendingLoans}
            subtitle={`${stats.pendingLoans} permintaan menunggu`}
            color="red"
            compact
          />
        </div>

        {/* Charts Section - More Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg border border-blue-100 p-3">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">
                Trend Peminjaman 6 Bulan
              </h3>
            </div>
            <div className="h-40">
              {loanTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loanTrendData}>
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="loans"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Belum ada data peminjaman
                </div>
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg border border-blue-100 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">
                Distribusi Status Peminjaman
              </h3>
            </div>
            <div className="h-40">
              {loanStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loanStatusData}>
                    <XAxis dataKey="status" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {loanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Belum ada data status
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tables Section - More Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-lg border border-blue-100">
            <div className="p-3 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Peminjaman Menunggu Approval
                </h2>
                <Badge color="bg-yellow-100 text-yellow-800 text-xs">
                  {pendingLoans.length} pending
                </Badge>
              </div>
            </div>
            <div className="p-3 max-h-56 overflow-y-auto">
              <div className="space-y-2">
                {pendingLoans.length === 0 ? (
                  <p className="text-gray-500 text-center py-3 text-sm">
                    Tidak ada peminjaman menunggu approval
                  </p>
                ) : (
                  pendingLoans.map((loan) => (
                    <div
                      key={loan.loan_id}
                      className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm truncate">
                          {loan.borrower?.name || loan.borrower?.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {loan.items?.length || 0} items •{" "}
                          {new Date(loan.created_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            {popularProductsData.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-blue-100 w-1/2">
                <div className="p-3 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-800 text-sm">
                      Produk Paling Sering Dipinjam
                    </h3>
                  </div>
                </div>
                <div className="p-3 max-h-56 overflow-y-auto">
                  <div className="space-y-2">
                    {popularProductsData.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800 text-sm truncate">
                            {product.name}
                          </span>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
                          {product.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Low Stock Products */}
            <div className="bg-white rounded-lg shadow-lg border border-blue-100 w-1/2">
              <div className="p-3 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Produk Stok Rendah
                  </h2>
                  <Badge color="bg-red-100 text-red-800 text-xs">
                    {lowStockProducts.length} items
                  </Badge>
                </div>
              </div>
              <div className="p-3 max-h-58 overflow-y-auto">
                <div className="space-y-2">
                  {lowStockProducts.length === 0 ? (
                    <p className="text-green-500 text-center py-3 text-sm">
                      Semua produk stok aman
                    </p>
                  ) : (
                    lowStockProducts.map((product) => (
                      <div
                        key={product.product_id}
                        className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100 hover:bg-red-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm truncate">
                            {product.product_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {product.category?.category_name || "-"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span
                            className={`font-bold text-sm whitespace-nowrap ${
                              product.product_avaible === 0
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {product.product_avaible}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
