import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  escrow_status: string | null;
  refund_status: string | null;
  dispute_status: string | null;
  delivery_region: string | null;
  delivery_city: string | null;
  total: number | string;
};

type OrderItemRow = {
  product_id: number;
  product_name: string;
  product_price: number | string;
  quantity: number;
  seller_id: string | null;
  seller_business_name: string | null;
  platform_commission_amount: number | string | null;
  seller_payout_amount: number | string | null;
  payout_status: string | null;
};

type SellerRow = {
  id: string;
  status: string | null;
  region: string | null;
  city: string | null;
};

type ProductRow = {
  id: number;
  product_status: string | null;
  seller_id: string | null;
};

type CustomerRow = {
  id: string;
};

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function incrementCounter(counter: Record<string, number>, key: string) {
  counter[key] = (counter[key] || 0) + 1;
}

function addMoney(counter: Record<string, number>, key: string, amount: number) {
  counter[key] = (counter[key] || 0) + amount;
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data: ordersData, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select(
      "id, created_at, status, payment_method, payment_status, escrow_status, refund_status, dispute_status, delivery_region, delivery_city, total"
    );

  if (ordersError) {
    return NextResponse.json({ message: ordersError.message }, { status: 500 });
  }

  const { data: orderItemsData, error: orderItemsError } = await supabaseAdmin
    .from("order_items")
    .select(
      "product_id, product_name, product_price, quantity, seller_id, seller_business_name, platform_commission_amount, seller_payout_amount, payout_status"
    );

  if (orderItemsError) {
    return NextResponse.json(
      { message: orderItemsError.message },
      { status: 500 }
    );
  }

  const { data: sellersData, error: sellersError } = await supabaseAdmin
    .from("sellers")
    .select("id, status, region, city");

  if (sellersError) {
    return NextResponse.json({ message: sellersError.message }, { status: 500 });
  }

  const { data: productsData, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, product_status, seller_id");

  if (productsError) {
    return NextResponse.json({ message: productsError.message }, { status: 500 });
  }

  const { data: customersData, error: customersError } = await supabaseAdmin
    .from("customers")
    .select("id");

  if (customersError) {
    return NextResponse.json({ message: customersError.message }, { status: 500 });
  }

  const orders = (ordersData || []) as OrderRow[];
  const orderItems = (orderItemsData || []) as OrderItemRow[];
  const sellers = (sellersData || []) as SellerRow[];
  const products = (productsData || []) as ProductRow[];
  const customers = (customersData || []) as CustomerRow[];

  const ordersByStatus: Record<string, number> = {};
  const paymentMethods: Record<string, number> = {};
  const paymentStatuses: Record<string, number> = {};
  const escrowStatuses: Record<string, number> = {};
  const ordersByRegion: Record<string, number> = {};
  const revenueByRegion: Record<string, number> = {};
  const sellerStatuses: Record<string, number> = {};
  const productStatuses: Record<string, number> = {};
  const topProductsMap: Record<
    string,
    {
      productName: string;
      quantitySold: number;
      grossSales: number;
    }
  > = {};
  const topSellersMap: Record<
    string,
    {
      sellerName: string;
      grossSales: number;
      quantitySold: number;
    }
  > = {};

  let grossMerchandiseValue = 0;
  let platformCommission = 0;
  let sellerPayout = 0;
  let pendingSellerPayout = 0;
  let paidSellerPayout = 0;
  let refundRequests = 0;
  let openDisputes = 0;

  orders.forEach((order) => {
    const orderTotal = Number(order.total || 0);

    grossMerchandiseValue += orderTotal;

    incrementCounter(ordersByStatus, order.status || "Unknown");
    incrementCounter(paymentMethods, order.payment_method || "Not specified");
    incrementCounter(paymentStatuses, order.payment_status || "Unknown");
    incrementCounter(escrowStatuses, order.escrow_status || "Unknown");

    const region = order.delivery_region || "Unknown region";
    incrementCounter(ordersByRegion, region);
    addMoney(revenueByRegion, region, orderTotal);

    if (order.refund_status && order.refund_status !== "None") {
      refundRequests += 1;
    }

    if (order.dispute_status && order.dispute_status !== "None") {
      openDisputes += 1;
    }
  });

  orderItems.forEach((item) => {
    const gross = Number(item.product_price || 0) * Number(item.quantity || 0);
    const commission = Number(item.platform_commission_amount || 0);
    const payout = Number(item.seller_payout_amount || 0);

    platformCommission += commission;
    sellerPayout += payout;

    if (item.payout_status === "Paid") {
      paidSellerPayout += payout;
    } else {
      pendingSellerPayout += payout;
    }

    const productKey = `${item.product_id}-${item.product_name}`;

    if (!topProductsMap[productKey]) {
      topProductsMap[productKey] = {
        productName: item.product_name,
        quantitySold: 0,
        grossSales: 0,
      };
    }

    topProductsMap[productKey].quantitySold += Number(item.quantity || 0);
    topProductsMap[productKey].grossSales += gross;

    const sellerKey = item.seller_id || "platform-store";

    if (!topSellersMap[sellerKey]) {
      topSellersMap[sellerKey] = {
        sellerName: item.seller_business_name || "Platform Store",
        grossSales: 0,
        quantitySold: 0,
      };
    }

    topSellersMap[sellerKey].grossSales += gross;
    topSellersMap[sellerKey].quantitySold += Number(item.quantity || 0);
  });

  sellers.forEach((seller) => {
    incrementCounter(sellerStatuses, seller.status || "Unknown");
  });

  products.forEach((product) => {
    incrementCounter(productStatuses, product.product_status || "Approved");
  });

  const topProducts = Object.values(topProductsMap)
    .sort((a, b) => b.grossSales - a.grossSales)
    .slice(0, 10);

  const topSellers = Object.values(topSellersMap)
    .sort((a, b) => b.grossSales - a.grossSales)
    .slice(0, 10);

  const topRegions = Object.entries(ordersByRegion)
    .map(([region, orderCount]) => ({
      region,
      orderCount,
      revenue: revenueByRegion[region] || 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return NextResponse.json({
    summary: {
      grossMerchandiseValue,
      platformCommission,
      sellerPayout,
      pendingSellerPayout,
      paidSellerPayout,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalSellers: sellers.length,
      verifiedSellers: sellerStatuses.Verified || 0,
      pendingSellers: sellerStatuses.Pending || 0,
      totalProducts: products.length,
      approvedProducts: productStatuses.Approved || 0,
      pendingProducts: productStatuses["Pending Review"] || 0,
      refundRequests,
      openDisputes,
    },
    ordersByStatus,
    paymentMethods,
    paymentStatuses,
    escrowStatuses,
    sellerStatuses,
    productStatuses,
    topRegions,
    topProducts,
    topSellers,
  });
}