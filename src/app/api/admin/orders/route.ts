import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createManyNotifications } from "@/lib/notificationService";
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
    seller_fulfillment_status: string | null;
  seller_ready_at: string | null;
  seller_fulfillment_note: string | null;
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

type NotificationInput = {
  audience: "customer" | "seller" | "admin";
  userId?: string | null;
  sellerId?: string | null;
  title: string;
  message: string;
  type?: string;
  relatedOrderId?: string | null;
  relatedProductId?: number | null;
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
            sellerFulfillmentStatus:
        item.seller_fulfillment_status || "Pending Seller Action",
      sellerReadyAt: item.seller_ready_at
        ? new Date(item.seller_ready_at).toLocaleString()
        : "",
      sellerFulfillmentNote: item.seller_fulfillment_note || "",
    })),
    total: Number(order.total),
  };
}

function getUniqueSellerIds(orderItems: DatabaseOrderItem[]) {
  return Array.from(
    new Set(
      orderItems
        .map((item) => item.seller_id)
        .filter((sellerId): sellerId is string => Boolean(sellerId))
    )
  );
}

function buildOrderUpdateNotifications({
  previousOrder,
  nextStatus,
  nextPaymentStatus,
  nextEscrowStatus,
  nextRefundStatus,
  nextDisputeStatus,
}: {
  previousOrder: DatabaseOrder;
  nextStatus: string;
  nextPaymentStatus: string;
  nextEscrowStatus: string;
  nextRefundStatus: string;
  nextDisputeStatus: string;
}) {
  const notifications: NotificationInput[] = [];
  const sellerIds = getUniqueSellerIds(previousOrder.order_items);

  function notifyCustomer(title: string, message: string, type: string) {
    if (!previousOrder.customer_id) {
      return;
    }

    notifications.push({
      audience: "customer",
      userId: previousOrder.customer_id,
      title,
      message,
      type,
      relatedOrderId: previousOrder.id,
    });
  }

  function notifySellers(title: string, message: string, type: string) {
    sellerIds.forEach((sellerId) => {
      notifications.push({
        audience: "seller",
        sellerId,
        title,
        message,
        type,
        relatedOrderId: previousOrder.id,
      });
    });
  }

  if ((previousOrder.payment_status || "Pending") !== nextPaymentStatus) {
    if (nextPaymentStatus === "Confirmed") {
      notifyCustomer(
        "Payment confirmed",
        `Payment for order ${previousOrder.id} has been confirmed. Your order is now being prepared.`,
        "payment_confirmed"
      );

      notifySellers(
        "Customer payment confirmed",
        `Payment has been confirmed for order ${previousOrder.id}. Please prepare the seller items when fulfilment begins.`,
        "seller_payment_confirmed"
      );
    }

    if (nextPaymentStatus === "Refunded") {
      notifyCustomer(
        "Payment refunded",
        `Order ${previousOrder.id} has been marked as refunded.`,
        "payment_refunded"
      );

      notifySellers(
        "Order refund processed",
        `Order ${previousOrder.id} has been marked as refunded. Seller payout may be affected.`,
        "seller_order_refunded"
      );
    }
  }

  if (previousOrder.status !== nextStatus) {
    notifyCustomer(
      "Order status updated",
      `Order ${previousOrder.id} status changed to ${nextStatus}.`,
      "order_status_updated"
    );

    notifySellers(
      "Seller order status updated",
      `Order ${previousOrder.id} status changed to ${nextStatus}.`,
      "seller_order_status_updated"
    );

    if (nextStatus === "Out for Delivery") {
      notifyCustomer(
        "Order is out for delivery",
        `Order ${previousOrder.id} is out for delivery. Please keep your delivery phone available.`,
        "order_out_for_delivery"
      );
    }

    if (nextStatus === "Delivered") {
      notifyCustomer(
        "Order delivered",
        `Order ${previousOrder.id} has been marked as delivered. Please confirm delivery in your order history if everything is correct.`,
        "order_delivered"
      );

      notifySellers(
        "Order delivered",
        `Order ${previousOrder.id} has been marked as delivered. Payout eligibility may begin after buyer confirmation/admin review.`,
        "seller_order_delivered"
      );
    }
  }

  if ((previousOrder.escrow_status || "Held") !== nextEscrowStatus) {
    notifyCustomer(
      "Escrow status updated",
      `Escrow status for order ${previousOrder.id} changed to ${nextEscrowStatus}.`,
      "escrow_status_updated"
    );

    notifySellers(
      "Escrow status updated",
      `Escrow status for order ${previousOrder.id} changed to ${nextEscrowStatus}.`,
      "seller_escrow_status_updated"
    );
  }

  if ((previousOrder.refund_status || "None") !== nextRefundStatus) {
    notifyCustomer(
      "Refund status updated",
      `Refund status for order ${previousOrder.id} changed to ${nextRefundStatus}.`,
      "refund_status_updated"
    );

    notifySellers(
      "Refund status updated",
      `Refund status for order ${previousOrder.id} changed to ${nextRefundStatus}.`,
      "seller_refund_status_updated"
    );
  }

  if ((previousOrder.dispute_status || "None") !== nextDisputeStatus) {
    notifyCustomer(
      "Dispute status updated",
      `Dispute status for order ${previousOrder.id} changed to ${nextDisputeStatus}.`,
      "dispute_status_updated"
    );

    notifySellers(
      "Dispute status updated",
      `Dispute status for order ${previousOrder.id} changed to ${nextDisputeStatus}.`,
      "seller_dispute_status_updated"
    );
  }

  return notifications;
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

  const { data: previousOrderData, error: previousOrderError } =
    await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

  if (previousOrderError || !previousOrderData) {
    return NextResponse.json(
      { message: previousOrderError?.message || "Order not found." },
      { status: 404 }
    );
  }

  const previousOrder = previousOrderData as DatabaseOrder;

  const shouldSetConfirmedAt =
    paymentStatus === "Confirmed" && previousOrder.payment_status !== "Confirmed";

  const paymentConfirmedAt = shouldSetConfirmedAt
    ? new Date().toISOString()
    : previousOrder.payment_confirmed_at;

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

  const notifications = buildOrderUpdateNotifications({
    previousOrder,
    nextStatus: status,
    nextPaymentStatus: paymentStatus,
    nextEscrowStatus: escrowStatus,
    nextRefundStatus: refundStatus,
    nextDisputeStatus: disputeStatus,
  });

  if (notifications.length > 0) {
    await createManyNotifications(notifications);
  }

  return NextResponse.json({
    message:
      "Order payment, fulfilment, refund, dispute, and notification details updated successfully.",
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