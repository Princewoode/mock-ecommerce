import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Order } from "@/types/models";

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
  payment_status: string | null;
  payment_phone: string | null;
  payment_reference: string | null;
  payment_note: string | null;
  payment_confirmed_at: string | null;
  escrow_status: string | null;
  courier_name: string | null;
  courier_phone: string | null;
  tracking_code: string | null;
  admin_note: string | null;
  status: string;
  payment_method: string | null;
  total: number | string;
  order_items: DatabaseOrderItem[];
};

function mapDatabaseOrder(order: DatabaseOrder): Order {
  return {
    id: order.id,
    customerId: order.customer_id || undefined,
    createdAt: new Date(order.created_at).toLocaleString(),
    status: order.status,
    paymentMethod: order.payment_method || "Not specified",
    payment: {
      status: order.payment_status || "Pending",
      phone: order.payment_phone || "",
      reference: order.payment_reference || "",
      note: order.payment_note || "",
      confirmedAt: order.payment_confirmed_at
        ? new Date(order.payment_confirmed_at).toLocaleString()
        : "",
      escrowStatus: order.escrow_status || "Held",
    },
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
      adminNote: order.admin_note || "",
    },
    items: order.order_items.map((item) => ({
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
    total: Number(order.total),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const customerId = searchParams.get("customerId");

  if (!email && !customerId) {
    return NextResponse.json(
      { message: "Customer email or customer ID is required." },
      { status: 400 }
    );
  }

  let query = supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else if (email) {
    query = query.eq("customer_email", email);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const orders = ((data || []) as DatabaseOrder[]).map(mapDatabaseOrder);

  return NextResponse.json({ orders });
}