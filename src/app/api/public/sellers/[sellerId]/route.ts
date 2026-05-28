import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SellerRow = {
  id: string;
  business_name: string;
  owner_name: string;
  region: string;
  city: string;
  business_address: string;
  product_categories: string;
  status: string;
  verification_note: string | null;
  created_at: string;
};

type ProductRow = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
  image_url: string;
  stock: number;
  seller_id: string | null;
  seller_business_name: string | null;
  product_status: string | null;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sellerId: string }> }
) {
  const { sellerId } = await context.params;

  if (!sellerId) {
    return NextResponse.json(
      { message: "Seller ID is required." },
      { status: 400 }
    );
  }

  const { data: sellerData, error: sellerError } = await supabaseAdmin
    .from("sellers")
    .select(
      "id, business_name, owner_name, region, city, business_address, product_categories, status, verification_note, created_at"
    )
    .eq("id", sellerId)
    .eq("status", "Verified")
    .single();

  if (sellerError || !sellerData) {
    return NextResponse.json(
      { message: "Verified seller not found." },
      { status: 404 }
    );
  }

  const seller = sellerData as SellerRow;

  const { data: productData, error: productError } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, category, description, price, image_url, stock, seller_id, seller_business_name, product_status"
    )
    .eq("seller_id", sellerId)
    .eq("product_status", "Approved")
    .order("id", { ascending: false });

  if (productError) {
    return NextResponse.json({ message: productError.message }, { status: 500 });
  }

  const products = ((productData || []) as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: Number(product.price),
    image: product.image_url,
    stock: product.stock,
    sellerId: product.seller_id || undefined,
    sellerBusinessName: product.seller_business_name || undefined,
    productStatus: product.product_status || "Approved",
  }));

  return NextResponse.json({
    seller: {
      id: seller.id,
      businessName: seller.business_name,
      ownerName: seller.owner_name,
      region: seller.region,
      city: seller.city,
      businessAddress: seller.business_address,
      productCategories: seller.product_categories,
      status: seller.status,
      verificationNote: seller.verification_note || "",
      createdAt: new Date(seller.created_at).toLocaleString(),
    },
    products,
  });
}