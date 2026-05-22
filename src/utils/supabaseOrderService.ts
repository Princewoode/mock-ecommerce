import { Order } from "@/types/models";

export async function createDatabaseOrder(order: Order): Promise<Order> {
  const response = await fetch("/api/checkout/place-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to save order to database.");
  }

  return result.order;
}