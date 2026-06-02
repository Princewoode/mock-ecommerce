import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notificationService";

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function mapDriver(row: any) {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    fullName: row.full_name,
    phone: row.phone,
    platformPhone: row.platform_phone || "",
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

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_drivers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    drivers: (data || []).map(mapDriver),
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

  const driverId = String(payload.driverId || "");
  const status = String(payload.status || "");
  const verificationNote = String(payload.verificationNote || "");
  const platformPhone = String(payload.platformPhone || "");

  const allowedStatuses = ["Pending", "Verified", "Rejected", "Suspended"];

  if (!driverId || !allowedStatuses.includes(status)) {
    return NextResponse.json(
      { message: "Valid driver ID and status are required." },
      { status: 400 }
    );
  }

  const { data: previousDriver, error: previousError } = await supabaseAdmin
    .from("delivery_drivers")
    .select("*")
    .eq("id", driverId)
    .single();

  if (previousError || !previousDriver) {
    return NextResponse.json(
      { message: previousError?.message || "Driver not found." },
      { status: 404 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_drivers")
    .update({
      status,
      verification_note: verificationNote,
      platform_phone: platformPhone || previousDriver.phone,
    })
    .eq("id", driverId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (previousDriver.status !== status && data.user_id) {
    await createNotification({
      audience: "customer",
      userId: data.user_id,
      title: "Delivery driver application updated",
      message: `Your delivery driver application status changed to ${status}.`,
      type: "delivery_driver_status_updated",
    });
  }

  return NextResponse.json({
    message: "Delivery driver profile updated successfully.",
    driver: mapDriver(data),
  });
}