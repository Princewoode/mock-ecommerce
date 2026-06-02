import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { createNotification } from "@/lib/notificationService";

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
  let userId = "";

  try {
    const user = await getAuthenticatedUser(request);
    userId = user.id;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Please log in to view delivery messages.",
      },
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

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("customer_id", userId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Order not found for this customer." },
      { status: 404 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_messages")
    .select("*")
    .eq("order_id", orderId)
    .eq("is_internal", false)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    messages: (data || []).map(mapMessage),
  });
}

export async function POST(request: NextRequest) {
  let userId = "";

  try {
    const user = await getAuthenticatedUser(request);
    userId = user.id;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Please log in to send a delivery message.",
      },
      { status: 401 }
    );
  }

  const payload = await request.json();

  const orderId = String(payload.orderId || "");
  const message = String(payload.message || "").trim();

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
    .eq("customer_id", userId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Order not found for this customer." },
      { status: 404 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_messages")
    .insert({
      order_id: orderId,
      sender_role: "customer",
      sender_name: order.customer_name,
      sender_user_id: userId,
      message,
      is_internal: false,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await createNotification({
    audience: "admin",
    title: "Customer sent delivery message",
    message: `${order.customer_name} sent a delivery message for order ${orderId}: ${message}`,
    type: "customer_delivery_message",
    relatedOrderId: orderId,
  });

  return NextResponse.json({
    message: "Delivery message sent successfully.",
    deliveryMessage: mapMessage(data),
  });
}