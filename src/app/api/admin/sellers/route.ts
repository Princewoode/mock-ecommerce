import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SellerProfile } from "@/types/models";

type DatabaseSeller = {
  id: string;
  user_id: string | null;
  business_name: string;
  owner_name: string;
  phone: string;
  momo_number: string;
  region: string;
  city: string;
  business_address: string;
  product_categories: string;
  status: "Pending" | "Verified" | "Rejected" | "Suspended";
  verification_note: string | null;
  created_at: string;
};

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function mapSeller(seller: DatabaseSeller): SellerProfile {
  return {
    id: seller.id,
    userId: seller.user_id || undefined,
    businessName: seller.business_name,
    ownerName: seller.owner_name,
    phone: seller.phone,
    momoNumber: seller.momo_number,
    region: seller.region,
    city: seller.city,
    businessAddress: seller.business_address,
    productCategories: seller.product_categories,
    status: seller.status,
    verificationNote: seller.verification_note || "",
    createdAt: new Date(seller.created_at).toLocaleString(),
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
    .from("sellers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    sellers: ((data || []) as DatabaseSeller[]).map(mapSeller),
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

  const sellerId = String(payload.sellerId || "");
  const status = String(payload.status || "");
  const verificationNote = String(payload.verificationNote || "");

  const validStatuses = ["Pending", "Verified", "Rejected", "Suspended"];

  if (!sellerId || !validStatuses.includes(status)) {
    return NextResponse.json(
      { message: "Valid seller ID and status are required." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("sellers")
    .update({
      status,
      verification_note: verificationNote,
    })
    .eq("id", sellerId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Seller verification status updated successfully.",
  });
}