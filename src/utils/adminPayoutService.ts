const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

export type PayoutItem = {
  id: string;
  orderId: string;
  orderStatus: string;
  createdAt: string;
  productName: string;
  grossAmount: number;
  platformCommissionAmount: number;
  sellerPayoutAmount: number;
  payoutStatus: string;
  payoutReference: string;
  payoutPaidAt: string;
};

export type SellerPayoutSummary = {
  sellerId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  momoNumber: string;
  region: string;
  city: string;
  grossSales: number;
  platformCommission: number;
  sellerPayout: number;
  pendingPayout: number;
  paidPayout: number;
  awaitingDeliveryPayout: number;
  cancelledPayout: number;
  eligibleItemIds: string[];
  items: PayoutItem[];
};

export type PayoutTotals = {
  grossSales: number;
  platformCommission: number;
  sellerPayout: number;
  pendingPayout: number;
  paidPayout: number;
  awaitingDeliveryPayout: number;
  cancelledPayout: number;
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
      `Server returned a non-JSON response. Check that /api/admin/payouts exists and restart the dev server. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Payout request failed.");
  }

  return result;
}

export async function getAdminPayouts(): Promise<{
  summaries: SellerPayoutSummary[];
  totals: PayoutTotals;
}> {
  const response = await fetch("/api/admin/payouts", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  return handleResponse(response);
}

export async function markSellerPayoutPaid({
  itemIds,
  payoutReference,
}: {
  itemIds: string[];
  payoutReference: string;
}) {
  const response = await fetch("/api/admin/payouts", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify({
      itemIds,
      payoutReference,
    }),
  });

  return handleResponse(response);
}