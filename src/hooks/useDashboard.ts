import { useQuery } from "@tanstack/react-query";

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

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const localToken = localStorage.getItem("accessToken");
  if (localToken) return localToken;

  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

  return cookieToken || null;
};

const fetchDashboardStats = async (): Promise<DashboardData> => {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const response = await fetch("/api/dashboard/stats", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result?.message || "Gagal memuat data dashboard");

  return result.data;
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}
