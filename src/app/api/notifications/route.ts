import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";

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
  try {
    const user = await getAuthenticatedUser(request);

    const { data: sellerData } = await supabaseAdmin
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: customerNotifications, error: customerError } =
      await supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("audience", "customer")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (customerError) {
      return NextResponse.json(
        { message: customerError.message },
        { status: 500 }
      );
    }

    let sellerNotifications: NotificationRow[] = [];

    if (sellerData?.id) {
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("audience", "seller")
        .eq("seller_id", sellerData.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }

      sellerNotifications = (data || []) as NotificationRow[];
    }

    const notifications = [
      ...((customerNotifications || []) as NotificationRow[]),
      ...sellerNotifications,
    ]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map(mapNotification);

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load notifications.",
      },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const payload = await request.json();
    const notificationId = String(payload.notificationId || "");

    if (!notificationId) {
      return NextResponse.json(
        { message: "Notification ID is required." },
        { status: 400 }
      );
    }

    const { data: sellerData } = await supabaseAdmin
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: notification, error: fetchError } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { message: "Notification not found." },
        { status: 404 }
      );
    }

    const row = notification as NotificationRow;

    const ownsCustomerNotification =
      row.audience === "customer" && row.user_id === user.id;

    const ownsSellerNotification =
      row.audience === "seller" && row.seller_id === sellerData?.id;

    if (!ownsCustomerNotification && !ownsSellerNotification) {
      return NextResponse.json(
        { message: "You cannot update this notification." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Notification marked as read.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update notification.",
      },
      { status: 401 }
    );
  }
}