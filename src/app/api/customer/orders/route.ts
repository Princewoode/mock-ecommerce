import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
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
  customer_delivery_confirmed_at: string | null;
  refund_status: string | null;
  refund_reason: string | null;
  refund_requested_at: string | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  dispute_requested_at: string | null;
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
    customerAction: {
      deliveryConfirmedAt: order.customer_delivery_confirmed_at
        ? new Date(order.customer_delivery_confirmed_at).toLocaleString()
        : "",
      refundStatus: order.refund_status || "None",
      refundReason: order.refund_reason || "",
      refundRequestedAt: order.refund_requested_at
        ? new Date(order.refund_requested_at).toLocaleString()
        : "",
      disputeStatus: order.dispute_status || "None",
      disputeReason: order.dispute_reason || "",
      disputeRequestedAt: order.dispute_requested_at
        ? new Date(order.dispute_requested_at).toLocaleString()
        : "",
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

export async function PUT(request: NextRequest) {
  let userId = "";

  try {
    const user = await getAuthenticatedUser(request);
    userId = user.id;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Please log in first.",
      },
      { status: 401 }
    );
  }

  const payload = await request.json();

  const orderId = String(payload.orderId || "");
  const action = String(payload.action || "");
  const reason = String(payload.reason || "").trim();

  if (!orderId || !action) {
    return NextResponse.json(
      { message: "Order ID and action are required." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, customer_id, status")
    .eq("id", orderId)
    .eq("customer_id", userId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Order not found for this customer." },
      { status: 404 }
    );
  }

  if (action === "confirm_delivery") {
    if (order.status !== "Delivered") {
      return NextResponse.json(
        {
          message:
            "You can only confirm delivery after the order is marked as Delivered.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        customer_delivery_confirmed_at: new Date().toISOString(),
        escrow_status: "Released",
        payment_note: "Customer confirmed delivery. Escrow can be released.",
      })
      .eq("id", orderId)
      .eq("customer_id", userId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Delivery confirmed successfully. Thank you.",
    });
  }

  if (action === "request_refund") {
    if (!reason) {
      return NextResponse.json(
        { message: "Please enter a refund reason." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "Refund Requested",
        refund_status: "Requested",
        refund_reason: reason,
        refund_requested_at: new Date().toISOString(),
        escrow_status: "Disputed",
        payment_note: "Customer requested a refund. Admin review required.",
      })
      .eq("id", orderId)
      .eq("customer_id", userId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Refund request submitted successfully.",
    });
  }

  if (action === "open_dispute") {
    if (!reason) {
      return NextResponse.json(
        { message: "Please enter a dispute reason." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "Refund Requested",
        dispute_status: "Open",
        dispute_reason: reason,
        dispute_requested_at: new Date().toISOString(),
        escrow_status: "Disputed",
        payment_note: "Customer opened a dispute. Admin review required.",
      })
      .eq("id", orderId)
      .eq("customer_id", userId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Dispute opened successfully.",
    });
  }

  return NextResponse.json(
    { message: "Invalid customer order action." },
    { status: 400 }
  );
}