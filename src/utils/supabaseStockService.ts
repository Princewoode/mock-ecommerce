import { CartItem } from "@/types/models";

export async function reduceDatabaseStockAfterOrder(items: CartItem[]) {
  const response = await fetch("/api/checkout/reduce-stock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to reduce database stock.");
  }

  return result;
}