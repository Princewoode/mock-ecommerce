import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";

function mapAssignment(row: any) {
  const driver = row.delivery_drivers;

  return {
    id: row.id,
    orderId: row.order_id,
    driverId: row.driver_id || undefined,
    driverName: driver?.full_name || "",
    driverPhone: driver?.phone || "",
    driverPlatformPhone: driver?.platform_phone || driver?.phone || "",
    driverVehicleType: driver?.vehicle_type || "",
    driverVehicleNumber: driver?.vehicle_number || "",
    assignmentType: row.assignment_type,
    assignmentStatus: row.assignment_status,
    pickupRegion: row.pickup_region || "",
    pickupCity: row.pickup_city || "",
    dropoffRegion: row.dropoff_region || "",
    dropoffCity: row.dropoff_city || "",
    routeNote: row.route_note || "",
    adminNote: row.admin_note || "",
    assignedAt: row.assigned_at
      ? new Date(row.assigned_at).toLocaleString()
      : "",
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "",
  };
}

function mapTrackingEvent(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    assignmentId: row.assignment_id || undefined,
    driverId: row.driver_id || undefined,
    eventTitle: row.event_title,
    eventMessage: row.event_message,
    eventStatus: row.event_status,
    locationNote: row.location_note || "",
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
            : "Please log in to track delivery.",
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

  const { data: assignments, error: assignmentError } = await supabaseAdmin
    .from("delivery_assignments")
    .select("*, delivery_drivers(*)")
    .eq("order_id", orderId)
    .order("assigned_at", { ascending: true });

  if (assignmentError) {
    return NextResponse.json(
      { message: assignmentError.message },
      { status: 500 }
    );
  }

  const { data: trackingEvents, error: trackingError } = await supabaseAdmin
    .from("delivery_tracking_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (trackingError) {
    return NextResponse.json(
      { message: trackingError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      createdAt: order.created_at
        ? new Date(order.created_at).toLocaleString()
        : "",
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      shippingAddress: order.shipping_address,
      deliveryRegion: order.delivery_region || "",
      deliveryCity: order.delivery_city || "",
      deliveryPhone: order.delivery_phone || "",
      courierName: order.courier_name || "",
      courierPhone: order.courier_phone || "",
      trackingCode: order.tracking_code || "",
      adminNote: order.admin_note || "",
      paymentStatus: order.payment_status || "Pending",
      escrowStatus: order.escrow_status || "Held",
    },
    assignments: (assignments || []).map(mapAssignment),
    trackingEvents: (trackingEvents || []).map(mapTrackingEvent),
  });
}