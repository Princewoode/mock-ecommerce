import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function verifyAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_API_PASSWORD;
  const receivedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword) && receivedPassword === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized admin request." },
      { status: 401 }
    );
  }

  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("audience", "admin")
    .eq("is_read", false);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data: latestUnread, error: latestError } = await supabaseAdmin
    .from("notifications")
    .select("id, title, message, type, created_at")
    .eq("audience", "admin")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(3);

  if (latestError) {
    return NextResponse.json({ message: latestError.message }, { status: 500 });
  }

  return NextResponse.json({
    unreadCount: count || 0,
    latestUnread: (latestUnread || []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: new Date(notification.created_at).toLocaleString(),
    })),
  });
}