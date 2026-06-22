import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function parseCoordinate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const coordinate = Number(value);

  if (!Number.isFinite(coordinate)) {
    return null;
  }

  return coordinate;
}

function isWithinGhana(latitude: number, longitude: number) {
  return (
    latitude >= 4 &&
    latitude <= 12 &&
    longitude >= -3.6 &&
    longitude <= 1.5
  );
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

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_hubs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    hubs: (data || []).map(mapHub),
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

  const hubName = String(payload.hubName || "").trim();
  const hubType = String(payload.hubType || "Cross-Dock").trim();
  const region = String(payload.region || "").trim();
  const city = String(payload.city || "").trim();
  const address = String(payload.address || "").trim();
  const contactPhone = String(payload.contactPhone || "").trim();
  const managerName = String(payload.managerName || "").trim();
  const managerPhone = String(payload.managerPhone || "").trim();
  const operatingHours = String(payload.operatingHours || "").trim();
  const adminNote = String(payload.adminNote || "").trim();

  const latitude = parseCoordinate(payload.latitude);
  const longitude = parseCoordinate(payload.longitude);

  if (!hubName || !region || !city) {
    return NextResponse.json(
      { message: "Hub name, region, and city are required." },
      { status: 400 }
    );
  }

  if ((latitude === null) !== (longitude === null)) {
    return NextResponse.json(
      {
        message:
          "Enter both latitude and longitude, or leave both coordinate fields empty.",
      },
      { status: 400 }
    );
  }

  if (
    latitude !== null &&
    longitude !== null &&
    !isWithinGhana(latitude, longitude)
  ) {
    return NextResponse.json(
      { message: "Hub coordinates must be within Ghana." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_hubs")
    .insert({
      hub_name: hubName,
      hub_type: hubType,
      region,
      city,
      address,
      contact_phone: contactPhone,
      manager_name: managerName,
      manager_phone: managerPhone,
      latitude,
      longitude,
      operating_hours: operatingHours,
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
    message: "Delivery hub created successfully.",
    hub: mapHub(data),
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

  const hubId = String(payload.hubId || "");
  const hubName = String(payload.hubName || "").trim();
  const hubType = String(payload.hubType || "Cross-Dock").trim();
  const region = String(payload.region || "").trim();
  const city = String(payload.city || "").trim();
  const address = String(payload.address || "").trim();
  const contactPhone = String(payload.contactPhone || "").trim();
  const managerName = String(payload.managerName || "").trim();
  const managerPhone = String(payload.managerPhone || "").trim();
  const operatingHours = String(payload.operatingHours || "").trim();
  const adminNote = String(payload.adminNote || "").trim();
  const isActive = Boolean(payload.isActive);

  const latitude = parseCoordinate(payload.latitude);
  const longitude = parseCoordinate(payload.longitude);

  if (!hubId || !hubName || !region || !city) {
    return NextResponse.json(
      { message: "Hub ID, hub name, region, and city are required." },
      { status: 400 }
    );
  }

  if ((latitude === null) !== (longitude === null)) {
    return NextResponse.json(
      {
        message:
          "Enter both latitude and longitude, or leave both coordinate fields empty.",
      },
      { status: 400 }
    );
  }

  if (
    latitude !== null &&
    longitude !== null &&
    !isWithinGhana(latitude, longitude)
  ) {
    return NextResponse.json(
      { message: "Hub coordinates must be within Ghana." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_hubs")
    .update({
      hub_name: hubName,
      hub_type: hubType,
      region,
      city,
      address,
      contact_phone: contactPhone,
      manager_name: managerName,
      manager_phone: managerPhone,
      latitude,
      longitude,
      operating_hours: operatingHours,
      is_active: isActive,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", hubId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Delivery hub updated successfully.",
    hub: mapHub(data),
  });
}