import { supabase } from "@/lib/supabaseClient";

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in before updating your order.");
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
      `Server returned a non-JSON response. Check customer order API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Customer order action failed.");
  }

  return result;
}

export async function confirmCustomerDelivery(orderId: string) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/customer/orders", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      orderId,
      action: "confirm_delivery",
    }),
  });

  return handleResponse(response);
}

export async function requestCustomerRefund({
  orderId,
  reason,
}: {
  orderId: string;
  reason: string;
}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/customer/orders", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      orderId,
      action: "request_refund",
      reason,
    }),
  });

  return handleResponse(response);
}

export async function openCustomerDispute({
  orderId,
  reason,
}: {
  orderId: string;
  reason: string;
}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/customer/orders", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      orderId,
      action: "open_dispute",
      reason,
    }),
  });

  return handleResponse(response);
}