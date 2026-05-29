import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateNotificationInput = {
  audience: "customer" | "seller" | "admin";
  userId?: string | null;
  sellerId?: string | null;
  title: string;
  message: string;
  type?: string;
  relatedOrderId?: string | null;
  relatedProductId?: number | null;
};

export async function createNotification(input: CreateNotificationInput) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    audience: input.audience,
    user_id: input.userId || null,
    seller_id: input.sellerId || null,
    title: input.title,
    message: input.message,
    type: input.type || "general",
    related_order_id: input.relatedOrderId || null,
    related_product_id: input.relatedProductId || null,
    is_read: false,
  });

  if (error) {
    console.error("Notification creation failed:", error.message);
  }
}

export async function createManyNotifications(
  notifications: CreateNotificationInput[]
) {
  await Promise.all(
    notifications.map((notification) => createNotification(notification))
  );
}