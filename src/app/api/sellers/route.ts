import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { createNotification } from "@/lib/notificationService";

type SellerPayload = {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  momoNumber?: string;
  region?: string;
  city?: string;
  businessAddress?: string;
  productCategories?: string;
};

function isValidGhanaPhoneNumber(phone: string) {
  const cleanedPhone = phone.replace(/\s/g, "");

  return /^0\d{9}$/.test(cleanedPhone) || /^\+233\d{9}$/.test(cleanedPhone);
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
            : "Please log in before applying as a seller.",
      },
      { status: 401 }
    );
  }

  const payload = (await request.json()) as SellerPayload;

  const businessName = String(payload.businessName || "").trim();
  const ownerName = String(payload.ownerName || "").trim();
  const phone = String(payload.phone || "").trim();
  const momoNumber = String(payload.momoNumber || "").trim();
  const region = String(payload.region || "").trim();
  const city = String(payload.city || "").trim();
  const businessAddress = String(payload.businessAddress || "").trim();
  const productCategories = String(payload.productCategories || "").trim();

  if (
    !businessName ||
    !ownerName ||
    !phone ||
    !momoNumber ||
    !region ||
    !city ||
    !businessAddress ||
    !productCategories
  ) {
    return NextResponse.json(
      { message: "Please fill in all seller application fields." },
      { status: 400 }
    );
  }

  if (!isValidGhanaPhoneNumber(phone)) {
    return NextResponse.json(
      { message: "Please enter a valid Ghana business phone number." },
      { status: 400 }
    );
  }

  if (!isValidGhanaPhoneNumber(momoNumber)) {
    return NextResponse.json(
      { message: "Please enter a valid Ghana Mobile Money number." },
      { status: 400 }
    );
  }

  const { data: existingSellerByUser } = await supabaseAdmin
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSellerByUser) {
    return NextResponse.json(
      { message: "You have already submitted a seller application." },
      { status: 400 }
    );
  }

  const { data: existingSellerByPhone } = await supabaseAdmin
    .from("sellers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingSellerByPhone) {
    return NextResponse.json(
      { message: "A seller application with this phone number already exists." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("sellers")
    .insert({
      user_id: userId,
      business_name: businessName,
      owner_name: ownerName,
      phone,
      momo_number: momoNumber,
      region,
      city,
      business_address: businessAddress,
      product_categories: productCategories,
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
    title: "New seller application",
    message: `${businessName} from ${city}, ${region} has submitted a seller application for review.`,
    type: "seller_application_submitted",
  });

  return NextResponse.json({
    message:
      "Seller application submitted successfully. Admin will review and verify the seller.",
    seller: data,
  });
}