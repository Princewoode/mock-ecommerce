import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notificationService";

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function mapHub(row: any) {
  return {
    id: row.id,
    hubName: row.hub_name,
    hubType: row.hub_type,
    region: row.region,
    city: row.city,
    address: row.address || "",
    contactPhone: row.contact_phone || "",
    managerName: row.manager_name || "",
    managerPhone: row.manager_phone || "",
    latitude: row.latitude === null ? undefined : Number(row.latitude),
    longitude: row.longitude === null ? undefined : Number(row.longitude),
    operatingHours: row.operating_hours || "",
    isActive: Boolean(row.is_active),
    adminNote: row.admin_note || "",
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleString()
      : "",
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "",
  };
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
    baseLat: row.base_lat === null ? undefined : Number(row.base_lat),
    baseLng: row.base_lng === null ? undefined : Number(row.base_lng),
    currentLat: row.current_lat === null ? undefined : Number(row.current_lat),
    currentLng: row.current_lng === null ? undefined : Number(row.current_lng),
    currentAccuracyMeters:
      row.current_accuracy_meters === null
        ? undefined
        : Number(row.current_accuracy_meters),
    lastLocationNote: row.last_location_note || "",
    lastLocationAt: row.last_location_at
      ? new Date(row.last_location_at).toLocaleString()
      : "",
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleString()
      : "",
  };
}

function mapAssignment(row: any, hubNames: Map<string, string>) {
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
    pickupLat: row.pickup_lat === null ? undefined : Number(row.pickup_lat),
    pickupLng: row.pickup_lng === null ? undefined : Number(row.pickup_lng),
    dropoffLat:
      row.dropoff_lat === null ? undefined : Number(row.dropoff_lat),
    dropoffLng:
      row.dropoff_lng === null ? undefined : Number(row.dropoff_lng),
    currentLat:
      row.current_lat === null ? undefined : Number(row.current_lat),
    currentLng:
      row.current_lng === null ? undefined : Number(row.current_lng),
    currentLocationNote: row.current_location_note || "",
    currentAccuracyMeters:
      row.current_accuracy_meters === null
        ? undefined
        : Number(row.current_accuracy_meters),
    lastLocationAt: row.last_location_at
      ? new Date(row.last_location_at).toLocaleString()
      : "",
    routeNote: row.route_note || "",
    adminNote: row.admin_note || "",
    originHubId: row.origin_hub_id || undefined,
    originHubName: row.origin_hub_id
      ? hubNames.get(row.origin_hub_id) || ""
      : "",
    destinationHubId: row.destination_hub_id || undefined,
    destinationHubName: row.destination_hub_id
      ? hubNames.get(row.destination_hub_id) || ""
      : "",
    legSequence: Number(row.leg_sequence || 1),
    handoverStatus: row.handover_status || "Not Required",
    handoverNote: row.handover_note || "",
    handedOverAt: row.handed_over_at
      ? new Date(row.handed_over_at).toLocaleString()
      : "",
    assignedAt: row.assigned_at
      ? new Date(row.assigned_at).toLocaleString()
      : "",
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "",
  };
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const [driversResult, hubsResult, assignmentsResult] = await Promise.all([
    supabaseAdmin
      .from("delivery_drivers")
      .select("*")
      .eq("status", "Verified")
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("delivery_hubs")
      .select("*")
      .eq("is_active", true)
      .order("hub_name", { ascending: true }),

    supabaseAdmin
      .from("delivery_assignments")
      .select("*, delivery_drivers(*)")
      .order("leg_sequence", { ascending: true }),
  ]);

  if (driversResult.error) {
    return NextResponse.json(
      { message: driversResult.error.message },
      { status: 500 }
    );
  }

  if (hubsResult.error) {
    return NextResponse.json(
      { message: hubsResult.error.message },
      { status: 500 }
    );
  }

  if (assignmentsResult.error) {
    return NextResponse.json(
      { message: assignmentsResult.error.message },
      { status: 500 }
    );
  }

  const hubNames = new Map<string, string>(
    (hubsResult.data || []).map((hub) => [hub.id, hub.hub_name])
  );

  return NextResponse.json({
    drivers: (driversResult.data || []).map(mapDriver),
    hubs: (hubsResult.data || []).map(mapHub),
    assignments: (assignmentsResult.data || []).map((assignment) =>
      mapAssignment(assignment, hubNames)
    ),
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

  if (payload.action !== "create-leg") {
    return NextResponse.json(
      { message: "Unsupported dispatch action." },
      { status: 400 }
    );
  }

  const orderId = String(payload.orderId || "");
  const driverId = String(payload.driverId || "");
  const assignmentType = String(payload.assignmentType || "Final Mile");
  const originHubId = String(payload.originHubId || "");
  const destinationHubId = String(payload.destinationHubId || "");
  const pickupRegion = String(payload.pickupRegion || "");
  const pickupCity = String(payload.pickupCity || "");
  const dropoffRegion = String(payload.dropoffRegion || "");
  const dropoffCity = String(payload.dropoffCity || "");
  const routeNote = String(payload.routeNote || "");
  const adminNote = String(payload.adminNote || "");

  if (!orderId || !driverId) {
    return NextResponse.json(
      { message: "Order and verified driver are required." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, customer_id, tracking_code, courier_name")
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
          driverError?.message ||
          "Selected driver is not verified or is unavailable.",
      },
      { status: 400 }
    );
  }

  const hubIds = [...new Set([originHubId, destinationHubId].filter(Boolean))];

  if (hubIds.length > 0) {
    const { data: hubs, error: hubsError } = await supabaseAdmin
      .from("delivery_hubs")
      .select("id, is_active")
      .in("id", hubIds);

    if (hubsError) {
      return NextResponse.json(
        { message: hubsError.message },
        { status: 500 }
      );
    }

    if (
      !hubs ||
      hubs.length !== hubIds.length ||
      hubs.some((hub) => !hub.is_active)
    ) {
      return NextResponse.json(
        { message: "Select active delivery hubs only." },
        { status: 400 }
      );
    }
  }

  const { data: existingLegs, error: existingLegsError } = await supabaseAdmin
    .from("delivery_assignments")
    .select("leg_sequence")
    .eq("order_id", orderId);

  if (existingLegsError) {
    return NextResponse.json(
      { message: existingLegsError.message },
      { status: 500 }
    );
  }

  const legSequence =
    Math.max(0, ...(existingLegs || []).map((leg) => leg.leg_sequence || 0)) +
    1;

  const handoverStatus = destinationHubId
    ? "Awaiting Arrival at Destination Hub"
    : originHubId
      ? "Awaiting Collection at Origin Hub"
      : "Not Required";

  const { data: assignment, error: assignmentError } = await supabaseAdmin
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
      origin_hub_id: originHubId || null,
      destination_hub_id: destinationHubId || null,
      leg_sequence: legSequence,
      handover_status: handoverStatus,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { message: assignmentError?.message || "Failed to create delivery leg." },
      { status: 500 }
    );
  }

  await supabaseAdmin.from("delivery_tracking_events").insert({
    order_id: orderId,
    assignment_id: assignment.id,
    driver_id: driverId,
    event_title: `Delivery leg ${legSequence} assigned`,
    event_message: `${driver.full_name} was assigned for ${assignmentType}.`,
    event_status: "Assigned",
    location_note: routeNote,
  });

  const shouldSetCurrentCourier =
    assignmentType === "Final Mile" ||
    (!originHubId && !destinationHubId && legSequence === 1);

  if (shouldSetCurrentCourier) {
    await supabaseAdmin
      .from("orders")
      .update({
        courier_name: driver.full_name,
        courier_phone: driver.platform_phone || driver.phone,
        tracking_code:
          order.tracking_code ||
          `GH-DEL-${orderId.slice(0, 8).toUpperCase()}`,
      })
      .eq("id", orderId);
  }

  if (order.customer_id) {
    await createNotification({
      audience: "customer",
      userId: order.customer_id,
      title: "New delivery leg assigned",
      message: `A ${assignmentType} delivery leg has been assigned for your order.`,
      type: "delivery_leg_assigned",
      relatedOrderId: orderId,
    });
  }

  return NextResponse.json({
    message: `Delivery leg ${legSequence} created successfully.`,
    assignment,
  });
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const payload = await request.json();

  if (payload.action !== "record-handover") {
    return NextResponse.json(
      { message: "Unsupported handover action." },
      { status: 400 }
    );
  }

  const fromAssignmentId = String(payload.fromAssignmentId || "");
  const toAssignmentId = String(payload.toAssignmentId || "");
  const hubId = String(payload.hubId || "");
  const eventType = String(payload.eventType || "");
  const eventNote = String(payload.eventNote || "").trim();

  const allowedEventTypes = [
    "Arrived at Hub",
    "Received at Hub",
    "Handed Over to Next Driver",
    "Departed Hub",
  ];

  if (
    !fromAssignmentId ||
    !hubId ||
    !allowedEventTypes.includes(eventType)
  ) {
    return NextResponse.json(
      {
        message:
          "Source delivery leg, hub, and valid handover event are required.",
      },
      { status: 400 }
    );
  }

  const { data: fromAssignment, error: fromError } = await supabaseAdmin
    .from("delivery_assignments")
    .select("*, delivery_drivers(*)")
    .eq("id", fromAssignmentId)
    .single();

  if (fromError || !fromAssignment) {
    return NextResponse.json(
      { message: fromError?.message || "Source delivery leg was not found." },
      { status: 404 }
    );
  }

  const { data: hub, error: hubError } = await supabaseAdmin
    .from("delivery_hubs")
    .select("*")
    .eq("id", hubId)
    .single();

  if (hubError || !hub) {
    return NextResponse.json(
      { message: hubError?.message || "Delivery hub was not found." },
      { status: 404 }
    );
  }

  let nextAssignment: any = null;

  if (toAssignmentId) {
    const { data, error } = await supabaseAdmin
      .from("delivery_assignments")
      .select("*")
      .eq("id", toAssignmentId)
      .eq("order_id", fromAssignment.order_id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: error?.message || "Next delivery leg was not found." },
        { status: 404 }
      );
    }

    if ((data.leg_sequence || 0) <= (fromAssignment.leg_sequence || 0)) {
      return NextResponse.json(
        { message: "Next delivery leg must follow the source delivery leg." },
        { status: 400 }
      );
    }

    nextAssignment = data;
  }

  const timestamp = new Date().toISOString();

  const handoverStatus =
    eventType === "Arrived at Hub"
      ? "At Hub"
      : eventType === "Received at Hub"
        ? "Received at Hub"
        : eventType === "Handed Over to Next Driver"
          ? "Handed Over"
          : "Departed Hub";

  const { error: updateFromError } = await supabaseAdmin
    .from("delivery_assignments")
    .update({
      handover_status: handoverStatus,
      handover_note: eventNote,
      handed_over_at:
        eventType === "Handed Over to Next Driver" ? timestamp : null,
      updated_at: timestamp,
    })
    .eq("id", fromAssignmentId);

  if (updateFromError) {
    return NextResponse.json(
      { message: updateFromError.message },
      { status: 500 }
    );
  }

  if (nextAssignment && eventType === "Handed Over to Next Driver") {
    await supabaseAdmin
      .from("delivery_assignments")
      .update({
        handover_status: "Received from Previous Leg",
        handover_note: eventNote,
        updated_at: timestamp,
      })
      .eq("id", nextAssignment.id);
  }

  const driverName =
    fromAssignment.delivery_drivers?.full_name || "Assigned driver";

  const eventMessage = eventNote
    ? eventNote
    : `${driverName} recorded ${eventType.toLowerCase()} at ${hub.hub_name}.`;

  await supabaseAdmin.from("delivery_handover_events").insert({
    order_id: fromAssignment.order_id,
    from_assignment_id: fromAssignmentId,
    to_assignment_id: toAssignmentId || null,
    hub_id: hubId,
    event_type: eventType,
    event_note: eventMessage,
    created_by_role: "admin",
    created_by_name: "Ghana Marketplace Admin",
  });

  await supabaseAdmin.from("delivery_tracking_events").insert({
    order_id: fromAssignment.order_id,
    assignment_id: fromAssignmentId,
    driver_id: fromAssignment.driver_id,
    event_title: `${eventType}: ${hub.hub_name}`,
    event_message: eventMessage,
    event_status: "At Delivery Hub",
    location_note: `${hub.city}, ${hub.region}`,
    latitude: hub.latitude,
    longitude: hub.longitude,
  });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("customer_id")
    .eq("id", fromAssignment.order_id)
    .single();

  if (order?.customer_id) {
    await createNotification({
      audience: "customer",
      userId: order.customer_id,
      title: "Package reached delivery hub",
      message: `Your package has an update: ${eventType} at ${hub.hub_name}.`,
      type: "delivery_handover_update",
      relatedOrderId: fromAssignment.order_id,
    });
  }

  return NextResponse.json({
    message: "Hub handover event recorded successfully.",
  });
}