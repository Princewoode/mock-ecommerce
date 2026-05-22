import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ProductReview } from "@/types/models";

type DatabaseReview = {
  id: string;
  product_id: number;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  rating: number;
  comment: string;
  created_at: string;
};

function mapDatabaseReview(review: DatabaseReview): ProductReview {
  return {
    id: review.id,
    productId: review.product_id,
    customerId: review.customer_id || review.customer_email,
    customerName: review.customer_name,
    customerEmail: review.customer_email,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(review.created_at).toLocaleString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = Number(searchParams.get("productId"));

  if (Number.isNaN(productId)) {
    return NextResponse.json(
      { message: "Valid product ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const reviews = ((data || []) as DatabaseReview[]).map(mapDatabaseReview);

  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const review = (await request.json()) as ProductReview;

  if (!review.productId || !review.customerEmail || !review.customerName) {
    return NextResponse.json(
      { message: "Missing review customer or product details." },
      { status: 400 }
    );
  }

  if (!review.comment.trim()) {
    return NextResponse.json(
      { message: "Review comment is required." },
      { status: 400 }
    );
  }

  if (review.rating < 1 || review.rating > 5) {
    return NextResponse.json(
      { message: "Rating must be between 1 and 5." },
      { status: 400 }
    );
  }

  const { data: existingReview, error: existingError } = await supabaseAdmin
    .from("reviews")
    .select("id")
    .eq("product_id", review.productId)
    .ilike("customer_email", review.customerEmail)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { message: existingError.message },
      { status: 500 }
    );
  }

  if (existingReview) {
    return NextResponse.json(
      { message: "You have already reviewed this product." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      product_id: review.productId,
      customer_id: null,
      customer_name: review.customerName,
      customer_email: review.customerEmail,
      rating: review.rating,
      comment: review.comment,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Review submitted successfully.",
    review: mapDatabaseReview(data as DatabaseReview),
  });
}