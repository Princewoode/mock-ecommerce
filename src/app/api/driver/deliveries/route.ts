import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { createNotification } from "@/lib/notificationService";

const allowedDriverStatuses = [
  "Pickup Started",
  "Picked Up",
  "In Transit",
  "Arrived Destination City",
  "Out for Final Delivery",
  "Delivered",
  "Failed Attempt",
];
function parseCoordinate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return numericValue;
}
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
      `Your delivery driver profile is currently ${data.status}. Admin verification is required before viewing deliveries.`
    );
  }

  return data;
}

function mapAssignment(row: any) {
  const order = row.orders;

  return {
    id: row.id,
    orderId: row.order_id,
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
    order: order
      ? {
          id: order.id,
          status: order.status,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          shippingAddress: order.shipping_address,
          deliveryRegion: order.delivery_region || "",
          deliveryCity: order.delivery_city || "",
          deliveryPhone: order.delivery_phone || "",
          deliveryFee: Number(order.delivery_fee || 0),
          paymentStatus: order.payment_status || "Pending",
          escrowStatus: order.escrow_status || "Held",
          trackingCode: order.tracking_code || "",
          adminNote: order.admin_note || "",
          createdAt: order.created_at
            ? new Date(order.created_at).toLocaleString()
            : "",
                pickupLat: row.pickup_lat === null ? undefined : Number(row.pickup_lat),
    pickupLng: row.pickup_lng === null ? undefined : Number(row.pickup_lng),
    dropoffLat: row.dropoff_lat === null ? undefined : Number(row.dropoff_lat),
    dropoffLng: row.dropoff_lng === null ? undefined : Number(row.dropoff_lng),
    currentLat: row.current_lat === null ? undefined : Number(row.current_lat),
    currentLng: row.current_lng === null ? undefined : Number(row.current_lng),
    currentLocationNote: row.current_location_note || "",
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const driver = await getVerifiedDriver(request);

    const { data, error } = await supabaseAdmin
      .from("delivery_assignments")
      .select("*, orders(*)")
      .eq("driver_id", driver.id)
      .order("assigned_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      driver: {
        id: driver.id,
        fullName: driver.full_name,
        phone: driver.phone,
        platformPhone: driver.platform_phone || driver.phone,
        region: driver.region,
        city: driver.city,
        vehicleType: driver.vehicle_type,
        vehicleNumber: driver.vehicle_number || "",
      },
      assignments: (data || []).map(mapAssignment),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load driver deliveries.",
      },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const driver = await getVerifiedDriver(request);
    const payload = await request.json();

    const assignmentId = String(payload.assignmentId || "");
    const assignmentStatus = String(payload.assignmentStatus || "");
    const locationNote = String(payload.locationNote || "").trim();
    const latitude = parseCoordinate(payload.latitude);
    const longitude = parseCoordinate(payload.longitude);
    if (!assignmentId || !allowedDriverStatuses.includes(assignmentStatus)) {
      return NextResponse.json(
        { message: "Valid assignment ID and delivery status are required." },
        { status: 400 }
      );
    }

    const { data: existingAssignment, error: assignmentError } =
      await supabaseAdmin
        .from("delivery_assignments")
        .select("*, orders(*)")
        .eq("id", assignmentId)
        .eq("driver_id", driver.id)
        .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { message: assignmentError?.message || "Assignment not found." },
        { status: 404 }
      );
    }

    const { data: updatedAssignment, error } = await supabaseAdmin
      .from("delivery_assignments")
      .update({
        assignment_status: assignmentStatus,
        updated_at: new Date().toISOString(),
                current_lat: latitude,
        current_lng: longitude,
        current_location_note: locationNote,
      })
      .eq("id", assignmentId)
      .eq("driver_id", driver.id)
      .select("*, orders(*)")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await supabaseAdmin.from("delivery_tracking_events").insert({
      order_id: existingAssignment.order_id,
      assignment_id: assignmentId,
      driver_id: driver.id,
      event_title: `Delivery status updated: ${assignmentStatus}`,
      event_message: `${driver.full_name} updated delivery status to ${assignmentStatus}.`,
      event_status: assignmentStatus,
      location_note: locationNote,
            latitude,
      longitude,
    });
    if (latitude !== null && longitude !== null) {
      await supabaseAdmin
        .from("delivery_drivers")
        .update({
          current_lat: latitude,
          current_lng: longitude,
          last_location_note: locationNote,
          last_location_at: new Date().toISOString(),
        })
        .eq("id", driver.id);
    }
    if (assignmentStatus === "Out for Final Delivery") {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "Out for Delivery",
          courier_name: driver.full_name,
          courier_phone: driver.platform_phone || driver.phone,
        })
        .eq("id", existingAssignment.order_id);
    }

    if (assignmentStatus === "Delivered") {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "Delivered",
          courier_name: driver.full_name,
          courier_phone: driver.platform_phone || driver.phone,
        })
        .eq("id", existingAssignment.order_id);
    }

    const order = existingAssignment.orders;

    if (order?.customer_id) {
      await createNotification({
        audience: "customer",
        userId: order.customer_id,
        title: "Delivery status updated",
        message: `Your order ${existingAssignment.order_id} delivery status changed to ${assignmentStatus}.`,
        type: "delivery_status_updated",
        relatedOrderId: existingAssignment.order_id,
      });
    }

    await createNotification({
      audience: "admin",
      title: "Driver updated delivery status",
      message: `${driver.full_name} updated order ${existingAssignment.order_id} to ${assignmentStatus}.`,
      type: "driver_delivery_status_updated",
      relatedOrderId: existingAssignment.order_id,
    });

    return NextResponse.json({
      message: "Delivery status updated successfully.",
      assignment: mapAssignment(updatedAssignment),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update delivery status.",
      },
      { status: 401 }
    );
  }
}