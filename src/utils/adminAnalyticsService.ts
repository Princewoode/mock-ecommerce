const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

export type AdminAnalyticsSummary = {
  grossMerchandiseValue: number;
  platformCommission: number;
  sellerPayout: number;
  pendingSellerPayout: number;
  paidSellerPayout: number;
  totalOrders: number;
  totalCustomers: number;
  totalSellers: number;
  verifiedSellers: number;
  pendingSellers: number;
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  refundRequests: number;
  openDisputes: number;
};

export type TopRegion = {
  region: string;
  orderCount: number;
  revenue: number;
};

export type TopProduct = {
  productName: string;
  quantitySold: number;
  grossSales: number;
};

export type TopSeller = {
  sellerName: string;
  grossSales: number;
  quantitySold: number;
};

export type AdminAnalytics = {
  summary: AdminAnalyticsSummary;
  ordersByStatus: Record<string, number>;
  paymentMethods: Record<string, number>;
  paymentStatuses: Record<string, number>;
  escrowStatuses: Record<string, number>;
  sellerStatuses: Record<string, number>;
  productStatuses: Record<string, number>;
  topRegions: TopRegion[];
  topProducts: TopProduct[];
  topSellers: TopSeller[];
};

function getAdminApiPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function handleResponse(response: Response) {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check admin analytics API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Admin analytics request failed.");
  }

  return result;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await fetch("/api/admin/analytics", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  return handleResponse(response);
}