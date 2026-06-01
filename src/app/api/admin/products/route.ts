import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notificationService";

type ProductPayload = {
  id?: number;
  name?: string;
  category?: string;
  description?: string;
  price?: number | string;
  image?: string;
  stock?: number | string;
  productStatus?: string;
  adminProductNote?: string;
  groupDealEnabled?: boolean;
  groupPrice?: number | string;
  groupMinQuantity?: number | string;
  groupDealNote?: string;
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

const validProductStatuses = [
  "Pending Review",
  "Approved",
  "Rejected",
  "Suspended",
];

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function mapProduct(row: SupabaseProductRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    image: row.image_url,
    stock: row.stock,
    sellerId: row.seller_id || undefined,
    sellerBusinessName: row.seller_business_name || undefined,
    productStatus: row.product_status || "Approved",
    adminProductNote: row.admin_product_note || "",
    isDefault: row.is_default,
    groupDealEnabled: Boolean(row.group_deal_enabled),
    groupPrice: row.group_price ? Number(row.group_price) : undefined,
    groupMinQuantity: row.group_min_quantity || 2,
    groupDealNote: row.group_deal_note || "",
  };
}

function validateProductPayload(payload: ProductPayload) {
  const name = String(payload.name || "").trim();
  const category = String(payload.category || "").trim();
  const description = String(payload.description || "").trim();
  const image = String(payload.image || "").trim();
  const price = Number(payload.price);
  const stock = Number(payload.stock);

  const productStatus = validProductStatuses.includes(
    String(payload.productStatus || "")
  )
    ? String(payload.productStatus)
    : "Approved";

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
      product_status: productStatus,
      admin_product_note: String(payload.adminProductNote || "").trim(),
      group_deal_enabled: groupDealEnabled,
      group_price: groupDealEnabled ? groupPrice : null,
      group_min_quantity: groupDealEnabled ? groupMinQuantity : 2,
      group_deal_note: groupDealEnabled ? groupDealNote : "",
    },
  };
}

async function notifySellerAboutProductStatus({
  previousProduct,
  updatedProduct,
}: {
  previousProduct: SupabaseProductRow;
  updatedProduct: SupabaseProductRow;
}) {
  if (!updatedProduct.seller_id) {
    return;
  }

  const previousStatus = previousProduct.product_status || "Approved";
  const nextStatus = updatedProduct.product_status || "Approved";

  if (previousStatus === nextStatus) {
    return;
  }

  let title = "Product review updated";
  let message = `Your product "${updatedProduct.name}" status changed to ${nextStatus}.`;

  if (nextStatus === "Approved") {
    title = "Product approved";
    message = `Your product "${updatedProduct.name}" has been approved and is now visible to buyers.`;
  }

  if (nextStatus === "Rejected") {
    title = "Product rejected";
    message = `Your product "${updatedProduct.name}" was rejected. Admin note: ${
      updatedProduct.admin_product_note || "No note provided."
    }`;
  }

  if (nextStatus === "Suspended") {
    title = "Product suspended";
    message = `Your product "${updatedProduct.name}" has been suspended. Admin note: ${
      updatedProduct.admin_product_note || "No note provided."
    }`;
  }

  if (nextStatus === "Pending Review") {
    title = "Product moved to review";
    message = `Your product "${updatedProduct.name}" is now pending admin review.`;
  }

  await createNotification({
    audience: "seller",
    sellerId: updatedProduct.seller_id,
    title,
    message,
    type: "product_review_status",
    relatedProductId: updatedProduct.id,
  });
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products: ((data || []) as SupabaseProductRow[]).map(mapProduct),
  });
}

export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const payload = (await request.json()) as ProductPayload;
  const validation = validateProductPayload({
    ...payload,
    productStatus: payload.productStatus || "Approved",
  });

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
      is_default: false,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Product created successfully.",
    product: mapProduct(data as SupabaseProductRow),
  });
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

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

  const { data: previousProductData, error: previousProductError } =
    await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

  if (previousProductError || !previousProductData) {
    return NextResponse.json(
      { message: previousProductError?.message || "Product not found." },
      { status: 404 }
    );
  }

  const previousProduct = previousProductData as SupabaseProductRow;

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(validation.product)
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const updatedProduct = data as SupabaseProductRow;

  await notifySellerAboutProductStatus({
    previousProduct,
    updatedProduct,
  });

  return NextResponse.json({
    message: "Product updated successfully.",
    product: mapProduct(updatedProduct),
  });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const productId = Number(searchParams.get("id"));

  if (Number.isNaN(productId)) {
    return NextResponse.json(
      { message: "Invalid product ID." },
      { status: 400 }
    );
  }

  const { data: existingProduct, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("is_default")
    .eq("id", productId)
    .single();

  if (fetchError) {
    return NextResponse.json({ message: fetchError.message }, { status: 500 });
  }

  if (existingProduct?.is_default) {
    return NextResponse.json(
      { message: "Default products cannot be deleted." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Product deleted successfully.",
  });
}