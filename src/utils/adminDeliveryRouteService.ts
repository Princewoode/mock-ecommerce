import { DeliveryRoute } from "@/types/models";

const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

function getAdminApiPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function handleResponse(response: Response) {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check admin delivery route API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Admin delivery route request failed.");
  }

  return result;
}

export async function getAdminDeliveryRoutes(): Promise<DeliveryRoute[]> {
  const response = await fetch("/api/admin/delivery-routes", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.routes || [];
}

export async function createAdminDeliveryRoute(payload: {
  routeName: string;
  routeType: string;
  originRegion?: string;
  originCity?: string;
  destinationRegion?: string;
  destinationCity?: string;
  routeZones?: string;
  estimatedDeliveryFee?: number;
  estimatedTransitTime?: string;
  adminNote?: string;
}) {
  const response = await fetch("/api/admin/delivery-routes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateAdminDeliveryRoute(payload: {
  routeId: string;
  routeName: string;
  routeType: string;
  originRegion?: string;
  originCity?: string;
  destinationRegion?: string;
  destinationCity?: string;
  routeZones?: string;
  estimatedDeliveryFee?: number;
  estimatedTransitTime?: string;
  isActive: boolean;
  adminNote?: string;
}) {
  const response = await fetch("/api/admin/delivery-routes", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}