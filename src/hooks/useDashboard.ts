import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useMemo } from "react";

export interface DashboardStats {
  totalProducts: number;
  totalAvailableProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalUsers: number;
  adminUsers: number;
  borrowerUsers: number;
  totalLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  returnedLoans: number;
  doneLoans: number;
  recentLoans: number;
}

export interface LowStockProduct {
  product_id: string;
  product_name: string;
  product_avaible: number;
  category: {
    category_name: string;
  } | null;
}

export interface PendingLoan {
  loan_id: string;
  status: string;
  created_at: string;
  borrower: {
    name: string;
    username: string;
  };
  items: Array<{
    product: {
      product_name: string;
    };
    quantity: number;
  }>;
}

export interface LoanForStats {
  loan_id: string;
  status: string;
  created_at: string;
  items: Array<{
    product_id: string;
    quantity: number;
    product: {
      product_name: string;
    };
  }>;
}

export interface RecentUser {
  user_id: string;
  name: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  lowStockProducts: LowStockProduct[];
  pendingLoans: PendingLoan[];
  allLoans: LoanForStats[];
  recentUsers: RecentUser[];
}

export interface DashboardFilters {
  timeframe?: "today" | "week" | "month" | "year";
  category_id?: string;
  status?: string;
}

// ==================== OPTIMIZED CACHE CONFIGURATION ====================
const DASHBOARD_CACHE_CONFIG = {
  SHORT_TERM: 1 * 60 * 1000, // 1 minute - untuk real-time data
  MEDIUM_TERM: 5 * 60 * 1000, // 5 minutes - untuk stats
  LONG_TERM: 10 * 60 * 1000, // 10 minutes - untuk historical data

  STALE_SHORT: 30 * 1000, // 30 seconds
  STALE_MEDIUM: 2 * 60 * 1000, // 2 minutes
} as const;

// ==================== OPTIMIZED QUERY KEYS ====================
export const DASHBOARD_QUERY_KEYS = {
  all: ["dashboard"] as const,
  stats: (filters?: DashboardFilters) =>
    [
      ...DASHBOARD_QUERY_KEYS.all,
      "stats",
      ...(filters ? [filters] : []),
    ] as const,
  lowStock: () => [...DASHBOARD_QUERY_KEYS.all, "low-stock"] as const,
  pendingLoans: () => [...DASHBOARD_QUERY_KEYS.all, "pending-loans"] as const,
  recentUsers: () => [...DASHBOARD_QUERY_KEYS.all, "recent-users"] as const,
  charts: (type: string, filters?: DashboardFilters) =>
    [
      ...DASHBOARD_QUERY_KEYS.all,
      "charts",
      type,
      ...(filters ? [filters] : []),
    ] as const,
} as const;

// ==================== OPTIMIZED UTILITY FUNCTIONS ====================
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

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Terjadi kesalahan pada server";

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson?.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result?.data ?? result;
};

// ==================== OPTIMIZED API FUNCTIONS ====================
const fetchDashboardStats = async (
  filters?: DashboardFilters
): Promise<DashboardData> => {
  const queryParams = new URLSearchParams();

  if (filters?.timeframe) queryParams.append("timeframe", filters.timeframe);
  if (filters?.category_id)
    queryParams.append("category_id", filters.category_id);
  if (filters?.status) queryParams.append("status", filters.status);

  const queryString = queryParams.toString();
  const url = `/api/dashboard/stats${queryString ? `?${queryString}` : ""}`;

  return fetchWithAuth(url);
};

const fetchLowStockProducts = async (): Promise<LowStockProduct[]> => {
  return fetchWithAuth("/api/dashboard/low-stock-products");
};

const fetchPendingLoans = async (): Promise<PendingLoan[]> => {
  return fetchWithAuth("/api/dashboard/pending-loans");
};

const fetchRecentUsers = async (): Promise<RecentUser[]> => {
  return fetchWithAuth("/api/dashboard/recent-users");
};

const fetchChartData = async (
  type: string,
  filters?: DashboardFilters
): Promise<any> => {
  const queryParams = new URLSearchParams();
  queryParams.append("type", type);

  if (filters?.timeframe) queryParams.append("timeframe", filters.timeframe);
  if (filters?.category_id)
    queryParams.append("category_id", filters.category_id);

  const queryString = queryParams.toString();
  const url = `/api/dashboard/charts${queryString ? `?${queryString}` : ""}`;

  return fetchWithAuth(url);
};

// ==================== OPTIMIZED QUERY HOOKS ====================

interface UseDashboardStatsOptions {
  filters?: DashboardFilters;
  queryOptions?: Partial<UseQueryOptions<DashboardData, Error>>;
}

export function useDashboardStats({
  filters,
  queryOptions,
}: UseDashboardStatsOptions = {}) {
  const queryKey = useMemo(
    () => DASHBOARD_QUERY_KEYS.stats(filters),
    [filters]
  );

  return useQuery({
    queryKey,
    queryFn: () => fetchDashboardStats(filters),
    staleTime: DASHBOARD_CACHE_CONFIG.STALE_MEDIUM,
    gcTime: DASHBOARD_CACHE_CONFIG.MEDIUM_TERM,
    retry: (failureCount, error) =>
      failureCount < 2 && !error.message.includes("Token"),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),

    placeholderData: (previousData) => previousData,

    ...queryOptions,
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.lowStock(),
    queryFn: fetchLowStockProducts,
    staleTime: DASHBOARD_CACHE_CONFIG.STALE_SHORT,
    gcTime: DASHBOARD_CACHE_CONFIG.SHORT_TERM,
    retry: 1,
  });
}

export function usePendingLoans() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.pendingLoans(),
    queryFn: fetchPendingLoans,
    staleTime: DASHBOARD_CACHE_CONFIG.STALE_SHORT,
    gcTime: DASHBOARD_CACHE_CONFIG.SHORT_TERM,
    retry: 1,
  });
}

export function useRecentUsers() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.recentUsers(),
    queryFn: fetchRecentUsers,
    staleTime: DASHBOARD_CACHE_CONFIG.STALE_MEDIUM,
    gcTime: DASHBOARD_CACHE_CONFIG.MEDIUM_TERM,
    retry: 1,
  });
}

export function useChartData(type: string, filters?: DashboardFilters) {
  const queryKey = useMemo(
    () => DASHBOARD_QUERY_KEYS.charts(type, filters),
    [type, filters]
  );

  return useQuery({
    queryKey,
    queryFn: () => fetchChartData(type, filters),
    staleTime: DASHBOARD_CACHE_CONFIG.STALE_MEDIUM,
    gcTime: DASHBOARD_CACHE_CONFIG.LONG_TERM,
    enabled: !!type,
    retry: 1,
  });
}

// ==================== OPTIMIZED SPECIALIZED HOOKS ====================

export function useDashboardSummary(filters?: DashboardFilters) {
  const { data, ...queryInfo } = useDashboardStats({ filters });

  const summary = useMemo(() => {
    if (!data?.stats) return null;

    const { stats } = data;

    return {
      products: {
        total: stats.totalProducts,
        available: stats.totalAvailableProducts,
        outOfStock: stats.outOfStockProducts,
        lowStock: stats.lowStockProducts,
        availabilityRate:
          stats.totalProducts > 0
            ? (stats.totalAvailableProducts / stats.totalProducts) * 100
            : 0,
      },

      users: {
        total: stats.totalUsers,
        admins: stats.adminUsers,
        borrowers: stats.borrowerUsers,
        adminPercentage:
          stats.totalUsers > 0
            ? (stats.adminUsers / stats.totalUsers) * 100
            : 0,
      },

      loans: {
        total: stats.totalLoans,
        pending: stats.pendingLoans,
        approved: stats.approvedLoans,
        rejected: stats.rejectedLoans,
        returned: stats.returnedLoans,
        done: stats.doneLoans,
        completionRate:
          stats.totalLoans > 0
            ? ((stats.doneLoans + stats.returnedLoans) / stats.totalLoans) * 100
            : 0,
      },

      quickStats: [
        {
          title: "Total Produk",
          value: stats.totalProducts,
          description: `${stats.totalAvailableProducts} tersedia`,
          trend:
            stats.totalAvailableProducts > 0
              ? "positive"
              : ("neutral" as const),
        },
        {
          title: "Total Pengguna",
          value: stats.totalUsers,
          description: `${stats.borrowerUsers} peminjam`,
          trend: "positive" as const,
        },
        {
          title: "Peminjaman Aktif",
          value: stats.pendingLoans + stats.approvedLoans,
          description: `${stats.pendingLoans} menunggu`,
          trend: stats.pendingLoans > 0 ? "warning" : ("positive" as const),
        },
        {
          title: "Stok Rendah",
          value: stats.lowStockProducts,
          description: "perlu perhatian",
          trend:
            stats.lowStockProducts > 0 ? "negative" : ("positive" as const),
        },
      ],
    };
  }, [data]);

  return {
    summary,
    rawData: data,
    ...queryInfo,
  };
}

export function useCriticalAlerts() {
  const { data: lowStockProducts, isLoading: lowStockLoading } =
    useLowStockProducts();
  const { data: pendingLoans, isLoading: pendingLoansLoading } =
    usePendingLoans();

  const alerts = useMemo(() => {
    const criticalAlerts = [];

    if (lowStockProducts && lowStockProducts.length > 0) {
      criticalAlerts.push({
        type: "low_stock" as const,
        severity: "high" as const,
        title: "Produk Stok Rendah",
        description: `${lowStockProducts.length} produk memiliki stok rendah`,
        count: lowStockProducts.length,
        items: lowStockProducts.slice(0, 5),
      });
    }

    if (pendingLoans && pendingLoans.length > 0) {
      criticalAlerts.push({
        type: "pending_loans" as const,
        severity: pendingLoans.length > 5 ? "high" : ("medium" as const),
        title: "Peminjaman Menunggu",
        description: `${pendingLoans.length} peminjaman menunggu persetujuan`,
        count: pendingLoans.length,
        items: pendingLoans.slice(0, 5),
      });
    }

    return criticalAlerts;
  }, [lowStockProducts, pendingLoans]);

  const hasCriticalAlerts = alerts.some((alert) => alert.severity === "high");
  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0);

  return {
    alerts,
    hasCriticalAlerts,
    totalAlerts,
    isLoading: lowStockLoading || pendingLoansLoading,
  };
}

export function useRealTimeStats(refetchInterval?: number) {
  const defaultRefetchInterval = 30000; 

  return useDashboardStats({
    queryOptions: {
      staleTime: DASHBOARD_CACHE_CONFIG.STALE_SHORT,
      gcTime: DASHBOARD_CACHE_CONFIG.SHORT_TERM,
      refetchInterval: refetchInterval || defaultRefetchInterval,
      refetchIntervalInBackground: true,
    },
  });
}

// ==================== OPTIMIZED PRELOADING HOOKS ====================

export function usePreloadDashboard() {
  const queryClient = useQueryClient();

  const preload = useMemo(
    () => ({
      stats: (filters?: DashboardFilters) =>
        queryClient.prefetchQuery({
          queryKey: DASHBOARD_QUERY_KEYS.stats(filters),
          queryFn: () => fetchDashboardStats(filters),
          staleTime: DASHBOARD_CACHE_CONFIG.STALE_MEDIUM,
        }),

      lowStock: () =>
        queryClient.prefetchQuery({
          queryKey: DASHBOARD_QUERY_KEYS.lowStock(),
          queryFn: fetchLowStockProducts,
          staleTime: DASHBOARD_CACHE_CONFIG.STALE_SHORT,
        }),

      pendingLoans: () =>
        queryClient.prefetchQuery({
          queryKey: DASHBOARD_QUERY_KEYS.pendingLoans(),
          queryFn: fetchPendingLoans,
          staleTime: DASHBOARD_CACHE_CONFIG.STALE_SHORT,
        }),

      all: (filters?: DashboardFilters) =>
        Promise.all([
          preload.stats(filters),
          preload.lowStock(),
          preload.pendingLoans(),
        ]),
    }),
    [queryClient]
  );

  return preload;
}

// ==================== OPTIMIZED MUTATION HOOKS FOR DASHBOARD UPDATES ====================

export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  const refresh = useMemo(
    () => ({
      all: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all }),
        ]),

      stats: (filters?: DashboardFilters) =>
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_QUERY_KEYS.stats(filters),
        }),

      lowStock: () =>
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_QUERY_KEYS.lowStock(),
        }),

      pendingLoans: () =>
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_QUERY_KEYS.pendingLoans(),
        }),

      withLoading: async () => {
        await refresh.all();
        await new Promise((resolve) => setTimeout(resolve, 500));
      },
    }),
    [queryClient]
  );

  return refresh;
}

// ==================== OPTIMIZED COMPUTED STATS HOOKS ====================

export function useLoanAnalytics(timeframe?: "week" | "month" | "year") {
  const { data, ...queryInfo } = useDashboardStats({
    filters: { timeframe },
  });

  const analytics = useMemo(() => {
    if (!data?.stats) return null;

    const { stats, allLoans = [] } = data;

    const totalActiveLoans = stats.pendingLoans + stats.approvedLoans;
    const completionRate =
      stats.totalLoans > 0
        ? ((stats.doneLoans + stats.returnedLoans) / stats.totalLoans) * 100
        : 0;

    const productUsage = allLoans.reduce((acc, loan) => {
      loan.items.forEach((item) => {
        const productId = item.product_id;
        acc[productId] = (acc[productId] || 0) + item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    const popularProducts = Object.entries(productUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalActiveLoans,
      completionRate: Math.round(completionRate * 100) / 100,
      approvalRate:
        stats.totalLoans > 0
          ? (stats.approvedLoans / stats.totalLoans) * 100
          : 0,
      popularProducts,
      trends: {
        pending: stats.pendingLoans,
        approved: stats.approvedLoans,
        completed: stats.doneLoans + stats.returnedLoans,
      },
    };
  }, [data, timeframe]);

  return {
    analytics,
    rawData: data,
    ...queryInfo,
  };
}
