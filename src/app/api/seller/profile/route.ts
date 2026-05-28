import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";

type SellerRow = {
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
  store_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  created_at: string;
};

function mapSeller(seller: SellerRow) {
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
    storeDescription: seller.store_description || "",
    logoUrl: seller.logo_url || "",
    bannerUrl: seller.banner_url || "",
    createdAt: new Date(seller.created_at).toLocaleString(),
  };
}

async function getSellerForRequest(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  const { data, error } = await supabaseAdmin
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("No seller profile found. Please apply as a seller first.");
  }

  return data as SellerRow;
}

export async function GET(request: NextRequest) {
  try {
    const seller = await getSellerForRequest(request);

    return NextResponse.json({
      seller: mapSeller(seller),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load seller profile.",
      },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const seller = await getSellerForRequest(request);
    const payload = await request.json();

    const storeDescription = String(payload.storeDescription || "").trim();
    const logoUrl = String(payload.logoUrl || "").trim();
    const bannerUrl = String(payload.bannerUrl || "").trim();

    const { data, error } = await supabaseAdmin
      .from("sellers")
      .update({
        store_description: storeDescription,
        logo_url: logoUrl,
        banner_url: bannerUrl,
      })
      .eq("id", seller.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Seller storefront profile updated successfully.",
      seller: mapSeller(data as SellerRow),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update seller profile.",
      },
      { status: 401 }
    );
  }
}