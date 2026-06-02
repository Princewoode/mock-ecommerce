import { DeliveryMessage } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

type ViewerRole = "customer" | "driver" | "admin";

type DeliveryMessageResponse = {
  messages?: DeliveryMessage[];
  message?: string;
  deliveryMessage?: DeliveryMessage;
};

function getAdminApiPassword(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function getEndpoint(viewerRole: ViewerRole): string {
  if (viewerRole === "admin") {
    return "/api/admin/delivery-messages";
  }

  if (viewerRole === "driver") {
    return "/api/driver/delivery-messages";
  }

  return "/api/customer/delivery-messages";
}

async function getRequestHeaders(
  viewerRole: ViewerRole,
  includeJsonContentType = false
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (viewerRole === "admin") {
    headers["x-admin-password"] = getAdminApiPassword();
    return headers;
  }

  const authHeaders = await getAuthHeaders();

  return {
    ...headers,
    ...authHeaders,
  };
}

async function handleResponse(
  response: Response
): Promise<DeliveryMessageResponse> {
  const text = await response.text();

  let result: DeliveryMessageResponse;

  try {
    result = JSON.parse(text) as DeliveryMessageResponse;
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check delivery message API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Delivery message request failed.");
  }

  return result;
}

export async function getDeliveryMessages({
  orderId,
  viewerRole,
}: {
  orderId: string;
  viewerRole: ViewerRole;
}): Promise<DeliveryMessage[]> {
  const endpoint = getEndpoint(viewerRole);
  const headers = await getRequestHeaders(viewerRole);

  const response = await fetch(
    `${endpoint}?orderId=${encodeURIComponent(orderId)}`,
    {
      headers,
    }
  );

  const result = await handleResponse(response);

  return result.messages || [];
}

export async function sendDeliveryMessage({
  orderId,
  viewerRole,
  message,
  isInternal = false,
}: {
  orderId: string;
  viewerRole: ViewerRole;
  message: string;
  isInternal?: boolean;
}) {
  const endpoint = getEndpoint(viewerRole);
  const headers = await getRequestHeaders(viewerRole, true);

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId,
      message,
      isInternal,
    }),
  });

  return handleResponse(response);
}