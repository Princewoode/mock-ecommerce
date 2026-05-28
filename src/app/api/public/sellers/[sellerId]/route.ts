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
  store_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
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

type ReviewRow = {
  rating: number;
};

type OrderItemRow = {
  order_id: string;
};

type OrderRow = {
  id: string;
  status: string;
};

function getTrustLabel(score: number, reviewCount: number) {
  if (reviewCount === 0) {
    return "New Seller";
  }

  if (score >= 85) {
    return "Top Trusted Seller";
  }

  if (score >= 65) {
    return "Trusted Seller";
  }

  return "Needs Review";
}

function calculateTrustScore({
  averageRating,
  reviewCount,
  deliveredOrders,
  totalSellerOrders,
  cancelledOrders,
}: {
  averageRating: number;
  reviewCount: number;
  deliveredOrders: number;
  totalSellerOrders: number;
  cancelledOrders: number;
}) {
  let score = 60;

  if (averageRating >= 4.5) {
    score += 15;
  } else if (averageRating >= 4) {
    score += 10;
  } else if (averageRating >= 3) {
    score += 5;
  }

  score += Math.min(reviewCount * 2, 10);
  score += Math.min(deliveredOrders * 2, 10);

  if (totalSellerOrders > 0) {
    const cancellationRate = cancelledOrders / totalSellerOrders;
    score -= cancellationRate * 30;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

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
      "id, business_name, owner_name, region, city, business_address, product_categories, status, verification_note, store_description, logo_url, banner_url, created_at"
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

  const productRows = (productData || []) as ProductRow[];
  const productIds = productRows.map((product) => product.id);

  let averageRating = 0;
  let reviewCount = 0;

  if (productIds.length > 0) {
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .in("product_id", productIds);

    if (reviewError) {
      return NextResponse.json({ message: reviewError.message }, { status: 500 });
    }

    const reviews = (reviewData || []) as ReviewRow[];
    reviewCount = reviews.length;

    if (reviewCount > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviewCount;
    }
  }

  let totalSellerOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;

  const { data: orderItemData, error: orderItemError } = await supabaseAdmin
    .from("order_items")
    .select("order_id")
    .eq("seller_id", sellerId);

  if (orderItemError) {
    return NextResponse.json(
      { message: orderItemError.message },
      { status: 500 }
    );
  }

  const orderIds = Array.from(
    new Set(((orderItemData || []) as OrderItemRow[]).map((item) => item.order_id))
  );

  if (orderIds.length > 0) {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .in("id", orderIds);

    if (orderError) {
      return NextResponse.json({ message: orderError.message }, { status: 500 });
    }

    const orders = (orderData || []) as OrderRow[];

    totalSellerOrders = orders.length;
    deliveredOrders = orders.filter((order) => order.status === "Delivered").length;
    cancelledOrders = orders.filter((order) =>
      ["Cancelled", "Refunded"].includes(order.status)
    ).length;
  }

  const trustScore = calculateTrustScore({
    averageRating,
    reviewCount,
    deliveredOrders,
    totalSellerOrders,
    cancelledOrders,
  });

  const products = productRows.map((product) => ({
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
      storeDescription: seller.store_description || "",
      logoUrl: seller.logo_url || "",
      bannerUrl: seller.banner_url || "",
      createdAt: new Date(seller.created_at).toLocaleString(),
    },
    products,
    trustStats: {
      averageRating,
      reviewCount,
      approvedProductCount: products.length,
      totalSellerOrders,
      deliveredOrders,
      cancelledOrders,
      trustScore,
      trustLabel: getTrustLabel(trustScore, reviewCount),
    },
  });
}