import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const { count: customerUnreadCount, error: customerError } =
      await supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("audience", "customer")
        .eq("user_id", user.id)
        .eq("is_read", false);

    if (customerError) {
      return NextResponse.json(
        { message: customerError.message },
        { status: 500 }
      );
    }

    const { data: sellerData } = await supabaseAdmin
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let sellerUnreadCount = 0;

    if (sellerData?.id) {
      const { count, error } = await supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("audience", "seller")
        .eq("seller_id", sellerData.id)
        .eq("is_read", false);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }

      sellerUnreadCount = count || 0;
    }

    return NextResponse.json({
      unreadCount: (customerUnreadCount || 0) + sellerUnreadCount,
      customerUnreadCount: customerUnreadCount || 0,
      sellerUnreadCount,
    });
  } catch {
    return NextResponse.json({
      unreadCount: 0,
      customerUnreadCount: 0,
      sellerUnreadCount: 0,
    });
  }
}