import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notificationService";

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}
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
function mapDriver(row: any) {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    fullName: row.full_name,
    phone: row.phone,
    platformPhone: row.platform_phone || row.phone || "",
    momoNumber: row.momo_number,
    region: row.region,
    city: row.city,
    vehicleType: row.vehicle_type,
    vehicleNumber: row.vehicle_number || "",
    licenseNumber: row.license_number || "",
    ghanaCardReference: row.ghana_card_reference || "",
    intraCityZones: row.intra_city_zones || "",
    interCityRoutes: row.inter_city_routes || "",
    availability: row.availability || "",
    emergencyContact: row.emergency_contact || "",
    driverNote: row.driver_note || "",
    status: row.status || "Pending",
    verificationNote: row.verification_note || "",
    createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : "",
  };
}

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
          pickupLat: row.pickup_lat === null ? undefined : Number(row.pickup_lat),
    pickupLng: row.pickup_lng === null ? undefined : Number(row.pickup_lng),
    dropoffLat: row.dropoff_lat === null ? undefined : Number(row.dropoff_lat),
    dropoffLng: row.dropoff_lng === null ? undefined : Number(row.dropoff_lng),
    currentLat: row.current_lat === null ? undefined : Number(row.current_lat),
    currentLng: row.current_lng === null ? undefined : Number(row.current_lng),
    currentLocationNote: row.current_location_note || "",
        currentAccuracyMeters:
      row.current_accuracy_meters === null
        ? undefined
        : Number(row.current_accuracy_meters),

    lastLocationAt: row.last_location_at
      ? new Date(row.last_location_at).toLocaleString()
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
        latitude: row.latitude === null ? undefined : Number(row.latitude),
    longitude: row.longitude === null ? undefined : Number(row.longitude),
  };
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data: drivers, error: driverError } = await supabaseAdmin
    .from("delivery_drivers")
    .select("*")
    .eq("status", "Verified")
    .order("created_at", { ascending: false });

  if (driverError) {
    return NextResponse.json({ message: driverError.message }, { status: 500 });
  }

  const { data: assignments, error: assignmentError } = await supabaseAdmin
    .from("delivery_assignments")
    .select("*, delivery_drivers(*)")
    .order("assigned_at", { ascending: false });

  if (assignmentError) {
    return NextResponse.json(
      { message: assignmentError.message },
      { status: 500 }
    );
  }

  const { data: trackingEvents, error: trackingError } = await supabaseAdmin
    .from("delivery_tracking_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (trackingError) {
    return NextResponse.json(
      { message: trackingError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    drivers: (drivers || []).map(mapDriver),
    assignments: (assignments || []).map(mapAssignment),
    trackingEvents: (trackingEvents || []).map(mapTrackingEvent),
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
  const driverId = String(payload.driverId || "");
  const assignmentType = String(payload.assignmentType || "Final Mile");
  const pickupRegion = String(payload.pickupRegion || "");
  const pickupCity = String(payload.pickupCity || "");
  const dropoffRegion = String(payload.dropoffRegion || "");
  const dropoffCity = String(payload.dropoffCity || "");
  const routeNote = String(payload.routeNote || "");
  const adminNote = String(payload.adminNote || "");
  const pickupLat = parseCoordinate(payload.pickupLat);
  const pickupLng = parseCoordinate(payload.pickupLng);
  const dropoffLat = parseCoordinate(payload.dropoffLat);
  const dropoffLng = parseCoordinate(payload.dropoffLng);
  if (!orderId || !driverId) {
    return NextResponse.json(
      { message: "Order ID and driver ID are required." },
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

  const { data: driver, error: driverError } = await supabaseAdmin
    .from("delivery_drivers")
    .select("*")
    .eq("id", driverId)
    .eq("status", "Verified")
    .single();

  if (driverError || !driver) {
    return NextResponse.json(
      {
        message:
          driverError?.message || "Verified delivery driver was not found.",
      },
      { status: 404 }
    );
  }

  const { data: assignment, error } = await supabaseAdmin
    .from("delivery_assignments")
    .insert({
      order_id: orderId,
      driver_id: driverId,
      assignment_type: assignmentType,
      assignment_status: "Assigned",
      pickup_region: pickupRegion,
      pickup_city: pickupCity,
      dropoff_region: dropoffRegion,
      dropoff_city: dropoffCity,
      route_note: routeNote,
      admin_note: adminNote,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
            pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      dropoff_lat: dropoffLat,
      dropoff_lng: dropoffLng,
      current_lat: pickupLat,
      current_lng: pickupLng,
      current_location_note: routeNote,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await supabaseAdmin.from("delivery_tracking_events").insert({
    order_id: orderId,
    assignment_id: assignment.id,
    driver_id: driverId,
    event_title: "Delivery driver assigned",
    event_message: `${driver.full_name} has been assigned for ${assignmentType} delivery.`,
    event_status: "Assigned",
    location_note: routeNote,
        latitude: pickupLat,
    longitude: pickupLng,
  });

  await supabaseAdmin
    .from("orders")
    .update({
      courier_name: driver.full_name,
      courier_phone: driver.platform_phone || driver.phone,
      tracking_code: `GH-DEL-${orderId.slice(0, 8).toUpperCase()}`,
      admin_note: adminNote || routeNote,
    })
    .eq("id", orderId);

  if (order.customer_id) {
    await createNotification({
      audience: "customer",
      userId: order.customer_id,
      title: "Delivery driver assigned",
      message: `${driver.full_name} has been assigned to your order ${orderId}. You can track delivery updates in your order history.`,
      type: "delivery_driver_assigned",
      relatedOrderId: orderId,
    });
  }

  return NextResponse.json({
    message: "Delivery driver assigned successfully.",
    assignment: mapAssignment({
      ...assignment,
      delivery_drivers: driver,
    }),
  });
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const payload = await request.json();

  const assignmentId = String(payload.assignmentId || "");
  const assignmentStatus = String(payload.assignmentStatus || "");
  const locationNote = String(payload.locationNote || "");
  const latitude = parseCoordinate(payload.latitude);
  const longitude = parseCoordinate(payload.longitude);
  if (!assignmentId || !assignmentStatus) {
    return NextResponse.json(
      { message: "Assignment ID and status are required." },
      { status: 400 }
    );
  }

  const { data: existingAssignment, error: existingError } =
    await supabaseAdmin
      .from("delivery_assignments")
      .select("*, delivery_drivers(*)")
      .eq("id", assignmentId)
      .single();

  if (existingError || !existingAssignment) {
    return NextResponse.json(
      { message: existingError?.message || "Assignment not found." },
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
    .select("*, delivery_drivers(*)")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const driver = existingAssignment.delivery_drivers;

  await supabaseAdmin.from("delivery_tracking_events").insert({
    order_id: existingAssignment.order_id,
    assignment_id: assignmentId,
    driver_id: existingAssignment.driver_id,
    event_title: `Delivery status updated: ${assignmentStatus}`,
    event_message: `${driver?.full_name || "Assigned driver"} updated delivery status to ${assignmentStatus}.`,
    event_status: assignmentStatus,
    location_note: locationNote,
        latitude,
    longitude,
  });

  if (assignmentStatus === "Out for Final Delivery") {
    await supabaseAdmin
      .from("orders")
      .update({ status: "Out for Delivery" })
      .eq("id", existingAssignment.order_id);
  }

  if (assignmentStatus === "Delivered") {
    await supabaseAdmin
      .from("orders")
      .update({ status: "Delivered" })
      .eq("id", existingAssignment.order_id);
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("customer_id")
    .eq("id", existingAssignment.order_id)
    .single();

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

  return NextResponse.json({
    message: "Delivery assignment updated successfully.",
    assignment: mapAssignment(updatedAssignment),
  });
}