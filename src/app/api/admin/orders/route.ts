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

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

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
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const orders = ((data || []) as DatabaseOrder[]).map(mapDatabaseOrder);

  return NextResponse.json({ orders });
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const payload = await request.json();

  const orderId = String(payload.orderId || "");
  const status = String(payload.status || "");
  const courierName = String(payload.courierName || "");
  const courierPhone = String(payload.courierPhone || "");
  const trackingCode = String(payload.trackingCode || "");
  const adminNote = String(payload.adminNote || "");

  const paymentStatus = String(payload.paymentStatus || "Pending");
  const paymentPhone = String(payload.paymentPhone || "");
  const paymentReference = String(payload.paymentReference || "");
  const paymentNote = String(payload.paymentNote || "");
  const escrowStatus = String(payload.escrowStatus || "Held");

  const refundStatus = String(payload.refundStatus || "None");
  const refundReason = String(payload.refundReason || "");
  const disputeStatus = String(payload.disputeStatus || "None");
  const disputeReason = String(payload.disputeReason || "");

  if (!orderId || !status) {
    return NextResponse.json(
      { message: "Order ID and status are required." },
      { status: 400 }
    );
  }

  const paymentConfirmedAt =
    paymentStatus === "Confirmed" ? new Date().toISOString() : null;

  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      status,
      courier_name: courierName,
      courier_phone: courierPhone,
      tracking_code: trackingCode,
      admin_note: adminNote,

      payment_status: paymentStatus,
      payment_phone: paymentPhone,
      payment_reference: paymentReference,
      payment_note: paymentNote,
      payment_confirmed_at: paymentConfirmedAt,
      escrow_status: escrowStatus,

      refund_status: refundStatus,
      refund_reason: refundReason,
      dispute_status: disputeStatus,
      dispute_reason: disputeReason,
    })
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message:
      "Order payment, fulfilment, refund, and dispute details updated successfully.",
  });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("id");

  if (!orderId) {
    return NextResponse.json(
      { message: "Order ID is required." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Order deleted successfully.",
  });
}