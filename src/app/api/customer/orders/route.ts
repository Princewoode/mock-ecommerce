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
};

type DatabaseOrder = {
  id: string;
  customer_id: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
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
    customer: {
      fullName: order.customer_name,
      email: order.customer_email,
      shippingAddress: order.shipping_address,
    },
    items: order.order_items.map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      category: item.product_category,
      image: item.product_image,
      price: Number(item.product_price),
      quantity: item.quantity,
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