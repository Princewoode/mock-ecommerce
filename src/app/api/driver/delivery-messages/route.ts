import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { createNotification } from "@/lib/notificationService";

async function getVerifiedDriver(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  const { data, error } = await supabaseAdmin
    .from("delivery_drivers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No delivery driver profile found. Please apply first.");
  }

  if (data.status !== "Verified") {
    throw new Error(
      `Your delivery driver profile is currently ${data.status}. Admin verification is required.`
    );
  }

  return data;
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
  try {
    const driver = await getVerifiedDriver(request);
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required." },
        { status: 400 }
      );
    }

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("id")
      .eq("order_id", orderId)
      .eq("driver_id", driver.id)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { message: "Delivery assignment not found for this driver." },
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
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load driver delivery messages.",
      },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const driver = await getVerifiedDriver(request);
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

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("id, orders(*)")
      .eq("order_id", orderId)
      .eq("driver_id", driver.id)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { message: "Delivery assignment not found for this driver." },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_messages")
      .insert({
        order_id: orderId,
        assignment_id: assignment.id,
        sender_role: "driver",
        sender_name: driver.full_name,
        sender_driver_id: driver.id,
        message,
        is_internal: false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const order = assignment.orders as any;

    if (order?.customer_id) {
      await createNotification({
        audience: "customer",
        userId: order.customer_id,
        title: "Driver sent delivery message",
        message: `${driver.full_name} sent a message about order ${orderId}: ${message}`,
        type: "driver_delivery_message",
        relatedOrderId: orderId,
      });
    }

    await createNotification({
      audience: "admin",
      title: "Driver sent delivery message",
      message: `${driver.full_name} sent a delivery message for order ${orderId}: ${message}`,
      type: "driver_delivery_message_admin",
      relatedOrderId: orderId,
    });

    return NextResponse.json({
      message: "Delivery message sent successfully.",
      deliveryMessage: mapMessage(data),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to send driver delivery message.",
      },
      { status: 401 }
    );
  }
}