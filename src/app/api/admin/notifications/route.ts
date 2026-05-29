import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type NotificationRow = {
  id: string;
  audience: "customer" | "seller" | "admin";
  user_id: string | null;
  seller_id: string | null;
  title: string;
  message: string;
  type: string;
  related_order_id: string | null;
  related_product_id: number | null;
  is_read: boolean;
  created_at: string;
};

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

function mapNotification(row: NotificationRow) {
  return {
    id: row.id,
    audience: row.audience,
    userId: row.user_id || undefined,
    sellerId: row.seller_id || undefined,
    title: row.title,
    message: row.message,
    type: row.type,
    relatedOrderId: row.related_order_id || undefined,
    relatedProductId: row.related_product_id || undefined,
    isRead: row.is_read,
    createdAt: new Date(row.created_at).toLocaleString(),
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
    .from("notifications")
    .select("*")
    .eq("audience", "admin")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    notifications: ((data || []) as NotificationRow[]).map(mapNotification),
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
  const notificationId = String(payload.notificationId || "");

  if (!notificationId) {
    return NextResponse.json(
      { message: "Notification ID is required." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("audience", "admin");

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Admin notification marked as read.",
  });
}