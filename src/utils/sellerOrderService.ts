import { Order } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in before viewing seller orders.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(response: Response) {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check seller order API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Seller order request failed.");
  }

  return result;
}

export async function getSellerOrders(): Promise<Order[]> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/seller/orders", {
    headers: {
      ...authHeaders,
    },
  });

  const result = await handleResponse(response);

  return result.orders || [];
}

export async function markSellerOrderReady({
  orderId,
  note,
}: {
  orderId: string;
  note?: string;
}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/seller/orders", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      orderId,
      note,
    }),
  });

  return handleResponse(response);
}