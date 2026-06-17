import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function mapRoute(row: any) {
  return {
    id: row.id,
    routeName: row.route_name,
    routeType: row.route_type,
    originRegion: row.origin_region || "",
    originCity: row.origin_city || "",
    destinationRegion: row.destination_region || "",
    destinationCity: row.destination_city || "",
    routeZones: row.route_zones || "",
    estimatedDeliveryFee: Number(row.estimated_delivery_fee || 0),
    estimatedTransitTime: row.estimated_transit_time || "",
    isActive: Boolean(row.is_active),
    adminNote: row.admin_note || "",
    createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toLocaleString() : "",
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
    .from("delivery_routes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    routes: (data || []).map(mapRoute),
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

  const routeName = String(payload.routeName || "").trim();
  const routeType = String(payload.routeType || "Intra-city").trim();
  const originRegion = String(payload.originRegion || "").trim();
  const originCity = String(payload.originCity || "").trim();
  const destinationRegion = String(payload.destinationRegion || "").trim();
  const destinationCity = String(payload.destinationCity || "").trim();
  const routeZones = String(payload.routeZones || "").trim();
  const estimatedDeliveryFee = Number(payload.estimatedDeliveryFee || 0);
  const estimatedTransitTime = String(payload.estimatedTransitTime || "").trim();
  const adminNote = String(payload.adminNote || "").trim();

  if (!routeName || !routeType) {
    return NextResponse.json(
      { message: "Route name and route type are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_routes")
    .insert({
      route_name: routeName,
      route_type: routeType,
      origin_region: originRegion,
      origin_city: originCity,
      destination_region: destinationRegion,
      destination_city: destinationCity,
      route_zones: routeZones,
      estimated_delivery_fee: estimatedDeliveryFee,
      estimated_transit_time: estimatedTransitTime,
      is_active: true,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Delivery route created successfully.",
    route: mapRoute(data),
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

  const routeId = String(payload.routeId || "");
  const routeName = String(payload.routeName || "").trim();
  const routeType = String(payload.routeType || "Intra-city").trim();
  const originRegion = String(payload.originRegion || "").trim();
  const originCity = String(payload.originCity || "").trim();
  const destinationRegion = String(payload.destinationRegion || "").trim();
  const destinationCity = String(payload.destinationCity || "").trim();
  const routeZones = String(payload.routeZones || "").trim();
  const estimatedDeliveryFee = Number(payload.estimatedDeliveryFee || 0);
  const estimatedTransitTime = String(payload.estimatedTransitTime || "").trim();
  const isActive = Boolean(payload.isActive);
  const adminNote = String(payload.adminNote || "").trim();

  if (!routeId || !routeName || !routeType) {
    return NextResponse.json(
      { message: "Route ID, route name, and route type are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_routes")
    .update({
      route_name: routeName,
      route_type: routeType,
      origin_region: originRegion,
      origin_city: originCity,
      destination_region: destinationRegion,
      destination_city: destinationCity,
      route_zones: routeZones,
      estimated_delivery_fee: estimatedDeliveryFee,
      estimated_transit_time: estimatedTransitTime,
      is_active: isActive,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Delivery route updated successfully.",
    route: mapRoute(data),
  });
}