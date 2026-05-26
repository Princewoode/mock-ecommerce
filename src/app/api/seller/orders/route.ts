import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { Order } from "@/types/models";

type DatabaseSeller = {
  id: string;
  business_name: string;
  status: string;
};

type DatabaseOrderItem = {
  product_id: number;
  product_name: string;
  product_category: string;
  product_image: string;
  product_price: number | string;
  quantity: number;
  seller_id: string | null;
  seller_business_name: string | null;
  platform_commission_rate: number | string | null;
  platform_commission_amount: number | string | null;
  seller_payout_amount: number | string | null;
};

type DatabaseOrder = {
  id: string;
  customer_id: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  delivery_region: string | null;
  delivery_city: string | null;
  delivery_phone: string | null;
  delivery_fee: number | string | null;
  courier_name: string | null;
  courier_phone: string | null;
  tracking_code: string | null;
  status: string;
  payment_method: string | null;
  total: number | string;
  order_items: DatabaseOrderItem[];
};

async function getVerifiedSeller(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  const { data, error } = await supabaseAdmin
    .from("sellers")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("No seller profile found. Please apply as a seller first.");
  }

  const seller = data as DatabaseSeller;

  if (seller.status !== "Verified") {
    throw new Error(
      `Your seller account is currently ${seller.status}. Admin verification is required before viewing orders.`
    );
  }

  return seller;
}

function mapSellerOrder(order: DatabaseOrder, sellerId: string): Order | null {
  const sellerItems = order.order_items.filter(
    (item) => item.seller_id === sellerId
  );

  if (sellerItems.length === 0) {
    return null;
  }

  const sellerSubtotal = sellerItems.reduce((sum, item) => {
    return sum + Number(item.product_price) * item.quantity;
  }, 0);

  return {
    id: order.id,
    customerId: order.customer_id || undefined,
    createdAt: new Date(order.created_at).toLocaleString(),
    status: order.status,
    paymentMethod: order.payment_method || "Not specified",
    customer: {
      fullName: order.customer_name,
      email: order.customer_email,
      shippingAddress: order.shipping_address,
    },
    delivery: {
      region: order.delivery_region || "",
      city: order.delivery_city || "",
      phone: order.delivery_phone || "",
      fee: Number(order.delivery_fee || 0),
    },
    fulfillment: {
      courierName: order.courier_name || "",
      courierPhone: order.courier_phone || "",
      trackingCode: order.tracking_code || "",
    },
    items: sellerItems.map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      category: item.product_category,
      image: item.product_image,
      price: Number(item.product_price),
      quantity: item.quantity,
      sellerId: item.seller_id || undefined,
      sellerBusinessName: item.seller_business_name || undefined,
      platformCommissionRate: Number(item.platform_commission_rate || 0),
      platformCommissionAmount: Number(item.platform_commission_amount || 0),
      sellerPayoutAmount: Number(item.seller_payout_amount || 0),
    })),
    total: sellerSubtotal,
  };
}

export async function GET(request: NextRequest) {
  try {
    const seller = await getVerifiedSeller(request);

    const { data: orderItemRows, error: orderItemError } = await supabaseAdmin
      .from("order_items")
      .select("order_id")
      .eq("seller_id", seller.id);

    if (orderItemError) {
      return NextResponse.json(
        { message: orderItemError.message },
        { status: 500 }
      );
    }

    const orderIds = Array.from(
      new Set((orderItemRows || []).map((item) => item.order_id))
    );

    if (orderIds.length === 0) {
      return NextResponse.json({
        seller: {
          id: seller.id,
          businessName: seller.business_name,
        },
        orders: [],
      });
    }

    const { data: orderRows, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .in("id", orderIds)
      .order("created_at", { ascending: false });

    if (orderError) {
      return NextResponse.json({ message: orderError.message }, { status: 500 });
    }

    const orders = ((orderRows || []) as DatabaseOrder[])
      .map((order) => mapSellerOrder(order, seller.id))
      .filter(Boolean);

    return NextResponse.json({
      seller: {
        id: seller.id,
        businessName: seller.business_name,
      },
      orders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load seller orders.",
      },
      { status: 401 }
    );
  }
}