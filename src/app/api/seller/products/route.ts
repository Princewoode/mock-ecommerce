import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { createNotification } from "@/lib/notificationService";

type ProductPayload = {
  id?: number;
  name?: string;
  category?: string;
  description?: string;
  price?: number | string;
  image?: string;
  stock?: number | string;
  groupDealEnabled?: boolean;
  groupPrice?: number | string;
  groupMinQuantity?: number | string;
  groupDealNote?: string;
};

type DatabaseSeller = {
  id: string;
  business_name: string;
  status: string;
};

type SupabaseProductRow = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
  image_url: string;
  stock: number;
  is_default: boolean;
  seller_id: string | null;
  seller_business_name: string | null;
  product_status: string | null;
  admin_product_note: string | null;
  group_deal_enabled: boolean | null;
  group_price: number | string | null;
  group_min_quantity: number | null;
  group_deal_note: string | null;
};

async function getVerifiedSeller(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  const { data, error } = await supabaseAdmin
    .from("sellers")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("No seller profile found. Please apply as a seller first.");
  }

  const seller = data as DatabaseSeller;

  if (seller.status !== "Verified") {
    throw new Error(
      `Your seller account is currently ${seller.status}. Admin verification is required before product management.`
    );
  }

  return seller;
}

function mapProduct(product: SupabaseProductRow) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: Number(product.price),
    image: product.image_url,
    stock: product.stock,
    sellerId: product.seller_id || undefined,
    sellerBusinessName: product.seller_business_name || undefined,
    productStatus: product.product_status || "Pending Review",
    adminProductNote: product.admin_product_note || "",
    isDefault: product.is_default,
    groupDealEnabled: Boolean(product.group_deal_enabled),
    groupPrice: product.group_price ? Number(product.group_price) : undefined,
    groupMinQuantity: product.group_min_quantity || 2,
    groupDealNote: product.group_deal_note || "",
  };
}

function validateProductPayload(payload: ProductPayload) {
  const name = String(payload.name || "").trim();
  const category = String(payload.category || "").trim();
  const description = String(payload.description || "").trim();
  const image = String(payload.image || "").trim();
  const price = Number(payload.price);
  const stock = Number(payload.stock);

  const groupDealEnabled = Boolean(payload.groupDealEnabled);
  const groupPrice = Number(payload.groupPrice || 0);
  const groupMinQuantity = Number(payload.groupMinQuantity || 2);
  const groupDealNote = String(payload.groupDealNote || "").trim();

  if (!name || !category || !description || !image) {
    return {
      valid: false,
      message: "Please fill in all product fields.",
      product: null,
    };
  }

  if (Number.isNaN(price) || price <= 0) {
    return {
      valid: false,
      message: "Please enter a valid product price.",
      product: null,
    };
  }

  if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    return {
      valid: false,
      message: "Please enter a valid whole-number stock quantity.",
      product: null,
    };
  }

  if (groupDealEnabled) {
    if (Number.isNaN(groupPrice) || groupPrice <= 0) {
      return {
        valid: false,
        message: "Please enter a valid group deal price.",
        product: null,
      };
    }

    if (groupPrice >= price) {
      return {
        valid: false,
        message: "Group deal price must be lower than the normal price.",
        product: null,
      };
    }

    if (
      Number.isNaN(groupMinQuantity) ||
      groupMinQuantity < 2 ||
      !Number.isInteger(groupMinQuantity)
    ) {
      return {
        valid: false,
        message: "Group minimum quantity must be a whole number of 2 or more.",
        product: null,
      };
    }
  }

  return {
    valid: true,
    message: "",
    product: {
      name,
      category,
      description,
      price,
      image_url: image,
      stock,
      group_deal_enabled: groupDealEnabled,
      group_price: groupDealEnabled ? groupPrice : null,
      group_min_quantity: groupDealEnabled ? groupMinQuantity : 2,
      group_deal_note: groupDealEnabled ? groupDealNote : "",
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const seller = await getVerifiedSeller(request);

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("seller_id", seller.id)
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: ((data || []) as SupabaseProductRow[]).map(mapProduct),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load seller products.",
      },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const seller = await getVerifiedSeller(request);
    const payload = (await request.json()) as ProductPayload;
    const validation = validateProductPayload(payload);

    if (!validation.valid || !validation.product) {
      return NextResponse.json(
        { message: validation.message },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        ...validation.product,
        seller_id: seller.id,
        seller_business_name: seller.business_name,
        is_default: false,
        product_status: "Pending Review",
        admin_product_note:
          "New seller product submitted for admin review.",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const product = data as SupabaseProductRow;

    await createNotification({
      audience: "admin",
      title: "New product pending review",
      message: `${seller.business_name} submitted "${product.name}" for product approval.`,
      type: "seller_product_submitted",
      relatedProductId: product.id,
    });

    return NextResponse.json({
      message:
        "Seller product submitted successfully. It will appear publicly after admin approval.",
      product: mapProduct(product),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create seller product.",
      },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const seller = await getVerifiedSeller(request);
    const payload = (await request.json()) as ProductPayload;
    const productId = Number(payload.id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID." },
        { status: 400 }
      );
    }

    const validation = validateProductPayload(payload);

    if (!validation.valid || !validation.product) {
      return NextResponse.json(
        { message: validation.message },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update({
        ...validation.product,
        seller_business_name: seller.business_name,
        product_status: "Pending Review",
        admin_product_note:
          "Seller updated this product. Pending admin re-approval.",
      })
      .eq("id", productId)
      .eq("seller_id", seller.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const product = data as SupabaseProductRow;

    await createNotification({
      audience: "admin",
      title: "Product edit pending review",
      message: `${seller.business_name} edited "${product.name}". Admin re-approval is required before it appears publicly.`,
      type: "seller_product_edited",
      relatedProductId: product.id,
    });

    return NextResponse.json({
      message:
        "Seller product updated successfully. It will appear publicly after admin approval.",
      product: mapProduct(product),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update seller product.",
      },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const seller = await getVerifiedSeller(request);
    const { searchParams } = new URL(request.url);
    const productId = Number(searchParams.get("id"));

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("seller_id", seller.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Seller product deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete seller product.",
      },
      { status: 401 }
    );
  }
}