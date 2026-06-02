import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { createNotification } from "@/lib/notificationService";

type DriverPayload = {
  fullName?: string;
  phone?: string;
  momoNumber?: string;
  region?: string;
  city?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  ghanaCardReference?: string;
  intraCityZones?: string;
  interCityRoutes?: string;
  availability?: string;
  emergencyContact?: string;
  driverNote?: string;
};

function isValidGhanaPhoneNumber(phone: string) {
  const cleanedPhone = phone.replace(/\s/g, "");

  return /^0\d{9}$/.test(cleanedPhone) || /^\+233\d{9}$/.test(cleanedPhone);
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
  try {
    const user = await getAuthenticatedUser(request);

    const { data, error } = await supabaseAdmin
      .from("delivery_drivers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      isLoggedIn: true,
      driver: data ? mapDriver(data) : null,
    });
  } catch {
    return NextResponse.json({
      isLoggedIn: false,
      driver: null,
    });
  }
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
            : "Please log in before applying as a delivery driver.",
      },
      { status: 401 }
    );
  }

  const payload = (await request.json()) as DriverPayload;

  const fullName = String(payload.fullName || "").trim();
  const phone = String(payload.phone || "").trim();
  const momoNumber = String(payload.momoNumber || "").trim();
  const region = String(payload.region || "").trim();
  const city = String(payload.city || "").trim();
  const vehicleType = String(payload.vehicleType || "").trim();
  const vehicleNumber = String(payload.vehicleNumber || "").trim();
  const licenseNumber = String(payload.licenseNumber || "").trim();
  const ghanaCardReference = String(payload.ghanaCardReference || "").trim();
  const intraCityZones = String(payload.intraCityZones || "").trim();
  const interCityRoutes = String(payload.interCityRoutes || "").trim();
  const availability = String(payload.availability || "").trim();
  const emergencyContact = String(payload.emergencyContact || "").trim();
  const driverNote = String(payload.driverNote || "").trim();

  if (!fullName || !phone || !momoNumber || !region || !city || !vehicleType) {
    return NextResponse.json(
      {
        message:
          "Please fill in full name, phone, MoMo number, region, city, and vehicle type.",
      },
      { status: 400 }
    );
  }

  if (!isValidGhanaPhoneNumber(phone)) {
    return NextResponse.json(
      { message: "Please enter a valid Ghana phone number." },
      { status: 400 }
    );
  }

  if (!isValidGhanaPhoneNumber(momoNumber)) {
    return NextResponse.json(
      { message: "Please enter a valid Ghana Mobile Money number." },
      { status: 400 }
    );
  }

  if (emergencyContact && !isValidGhanaPhoneNumber(emergencyContact)) {
    return NextResponse.json(
      { message: "Please enter a valid emergency contact number." },
      { status: 400 }
    );
  }

  const { data: existingByUser } = await supabaseAdmin
    .from("delivery_drivers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingByUser) {
    return NextResponse.json(
      { message: "You have already submitted a delivery driver application." },
      { status: 400 }
    );
  }

  const { data: existingByPhone } = await supabaseAdmin
    .from("delivery_drivers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingByPhone) {
    return NextResponse.json(
      {
        message:
          "A delivery driver application with this phone number already exists.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("delivery_drivers")
    .insert({
      user_id: userId,
      full_name: fullName,
      phone,
      platform_phone: phone,
      momo_number: momoNumber,
      region,
      city,
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber,
      license_number: licenseNumber,
      ghana_card_reference: ghanaCardReference,
      intra_city_zones: intraCityZones,
      inter_city_routes: interCityRoutes,
      availability,
      emergency_contact: emergencyContact,
      driver_note: driverNote,
      status: "Pending",
      verification_note: "",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await createNotification({
    audience: "admin",
    title: "New delivery driver application",
    message: `${fullName} from ${city}, ${region} applied as a ${vehicleType} delivery driver.`,
    type: "delivery_driver_application",
  });

  return NextResponse.json({
    message:
      "Delivery driver application submitted successfully. Admin will review and verify your profile.",
    driver: mapDriver(data),
  });
}