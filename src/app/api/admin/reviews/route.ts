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

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

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
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const reviews = ((data || []) as DatabaseReview[]).map(mapDatabaseReview);

  return NextResponse.json({ reviews });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("id");

  if (!reviewId) {
    return NextResponse.json(
      { message: "Review ID is required." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Review deleted successfully.",
  });
}