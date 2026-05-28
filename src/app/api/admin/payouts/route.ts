import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type OrderItemRow = {
  id: string;
  order_id: string;
  product_name: string;
  product_price: number | string;
  quantity: number;
  seller_id: string | null;
  seller_business_name: string | null;
  platform_commission_amount: number | string | null;
  seller_payout_amount: number | string | null;
  payout_status: string | null;
  payout_reference: string | null;
  payout_paid_at: string | null;
};

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
};

type SellerRow = {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  momo_number: string;
  region: string;
  city: string;
};

type PayoutItem = {
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

type SellerPayoutSummary = {
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

const deliveredStatuses = ["Delivered"];
const cancelledStatuses = ["Cancelled", "Refunded"];

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function createEmptySummary(seller: SellerRow): SellerPayoutSummary {
  return {
    sellerId: seller.id,
    businessName: seller.business_name,
    ownerName: seller.owner_name,
    phone: seller.phone,
    momoNumber: seller.momo_number,
    region: seller.region,
    city: seller.city,
    grossSales: 0,
    platformCommission: 0,
    sellerPayout: 0,
    pendingPayout: 0,
    paidPayout: 0,
    awaitingDeliveryPayout: 0,
    cancelledPayout: 0,
    eligibleItemIds: [],
    items: [],
  };
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data: itemData, error: itemError } = await supabaseAdmin
    .from("order_items")
    .select(
      "id, order_id, product_name, product_price, quantity, seller_id, seller_business_name, platform_commission_amount, seller_payout_amount, payout_status, payout_reference, payout_paid_at"
    )
    .not("seller_id", "is", null);

  if (itemError) {
    return NextResponse.json({ message: itemError.message }, { status: 500 });
  }

  const items = (itemData || []) as OrderItemRow[];

  if (items.length === 0) {
    return NextResponse.json({
      summaries: [],
      totals: {
        grossSales: 0,
        platformCommission: 0,
        sellerPayout: 0,
        pendingPayout: 0,
        paidPayout: 0,
        awaitingDeliveryPayout: 0,
        cancelledPayout: 0,
      },
    });
  }

  const orderIds = Array.from(new Set(items.map((item) => item.order_id)));
  const sellerIds = Array.from(
    new Set(items.map((item) => item.seller_id).filter(Boolean))
  ) as string[];

  const { data: orderData, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, created_at")
    .in("id", orderIds);

  if (orderError) {
    return NextResponse.json({ message: orderError.message }, { status: 500 });
  }

  const { data: sellerData, error: sellerError } = await supabaseAdmin
    .from("sellers")
    .select("id, business_name, owner_name, phone, momo_number, region, city")
    .in("id", sellerIds);

  if (sellerError) {
    return NextResponse.json({ message: sellerError.message }, { status: 500 });
  }

  const ordersById = new Map(
    ((orderData || []) as OrderRow[]).map((order) => [order.id, order])
  );

  const summariesBySeller = new Map<string, SellerPayoutSummary>();

  ((sellerData || []) as SellerRow[]).forEach((seller) => {
    summariesBySeller.set(seller.id, createEmptySummary(seller));
  });

  items.forEach((item) => {
    if (!item.seller_id) {
      return;
    }

    const summary = summariesBySeller.get(item.seller_id);

    if (!summary) {
      return;
    }

    const order = ordersById.get(item.order_id);
    const orderStatus = order?.status || "Unknown";
    const grossAmount = Number(item.product_price) * item.quantity;
    const platformCommissionAmount = Number(
      item.platform_commission_amount || 0
    );
    const sellerPayoutAmount = Number(item.seller_payout_amount || grossAmount);
    const payoutStatus = item.payout_status || "Pending";

    summary.grossSales += grossAmount;
    summary.platformCommission += platformCommissionAmount;
    summary.sellerPayout += sellerPayoutAmount;

    if (payoutStatus === "Paid") {
      summary.paidPayout += sellerPayoutAmount;
    } else if (deliveredStatuses.includes(orderStatus)) {
      summary.pendingPayout += sellerPayoutAmount;
      summary.eligibleItemIds.push(item.id);
    } else if (cancelledStatuses.includes(orderStatus)) {
      summary.cancelledPayout += sellerPayoutAmount;
    } else {
      summary.awaitingDeliveryPayout += sellerPayoutAmount;
    }

    summary.items.push({
      id: item.id,
      orderId: item.order_id,
      orderStatus,
      createdAt: order
        ? new Date(order.created_at).toLocaleString()
        : "Unknown date",
      productName: item.product_name,
      grossAmount,
      platformCommissionAmount,
      sellerPayoutAmount,
      payoutStatus,
      payoutReference: item.payout_reference || "",
      payoutPaidAt: item.payout_paid_at
        ? new Date(item.payout_paid_at).toLocaleString()
        : "",
    });
  });

  const summaries = Array.from(summariesBySeller.values()).sort(
    (a, b) => b.pendingPayout - a.pendingPayout
  );

  const totals = summaries.reduce(
    (total, seller) => {
      total.grossSales += seller.grossSales;
      total.platformCommission += seller.platformCommission;
      total.sellerPayout += seller.sellerPayout;
      total.pendingPayout += seller.pendingPayout;
      total.paidPayout += seller.paidPayout;
      total.awaitingDeliveryPayout += seller.awaitingDeliveryPayout;
      total.cancelledPayout += seller.cancelledPayout;

      return total;
    },
    {
      grossSales: 0,
      platformCommission: 0,
      sellerPayout: 0,
      pendingPayout: 0,
      paidPayout: 0,
      awaitingDeliveryPayout: 0,
      cancelledPayout: 0,
    }
  );

  return NextResponse.json({
    summaries,
    totals,
  });
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const payload = await request.json();

  const itemIds = Array.isArray(payload.itemIds)
    ? (payload.itemIds as string[])
    : [];

  const payoutReference = String(payload.payoutReference || "").trim();

  if (itemIds.length === 0) {
    return NextResponse.json(
      { message: "No eligible payout items selected." },
      { status: 400 }
    );
  }

  if (!payoutReference) {
    return NextResponse.json(
      { message: "Please enter a payout reference." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("order_items")
    .update({
      payout_status: "Paid",
      payout_reference: payoutReference,
      payout_paid_at: new Date().toISOString(),
    })
    .in("id", itemIds);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Seller payout marked as paid successfully.",
  });
}