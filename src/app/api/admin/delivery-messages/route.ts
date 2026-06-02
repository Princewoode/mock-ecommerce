import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notificationService";

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function mapMessage(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    assignmentId: row.assignment_id || undefined,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    senderUserId: row.sender_user_id || undefined,
    senderDriverId: row.sender_driver_id || undefined,
    message: row.message,
    isInternal: Boolean(row.is_internal),
    createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : "",
  };
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { message: "Order ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    messages: (data || []).map(mapMessage),
  });
}

export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const payload = await request.json();

  const orderId = String(payload.orderId || "");
  const message = String(payload.message || "").trim();
  const isInternal = Boolean(payload.isInternal);

  if (!orderId || !message) {
    return NextResponse.json(
      { message: "Order ID and message are required." },
      { status: 400 }
    );
  }

  if (message.length > 700) {
    return NextResponse.json(
      { message: "Delivery message cannot exceed 700 characters." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: orderError?.message || "Order not found." },
      { status: 404 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_messages")
    .insert({
      order_id: orderId,
      sender_role: "admin",
      sender_name: "Ghana Marketplace Admin",
      message,
      is_internal: isInternal,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!isInternal && order.customer_id) {
    await createNotification({
      audience: "customer",
      userId: order.customer_id,
      title: "Admin sent delivery message",
      message: `Admin sent a delivery message for order ${orderId}: ${message}`,
      type: "admin_delivery_message",
      relatedOrderId: orderId,
    });
  }

  return NextResponse.json({
    message: "Admin delivery message sent successfully.",
    deliveryMessage: mapMessage(data),
  });
}