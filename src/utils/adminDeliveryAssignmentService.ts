import {
  DeliveryAssignment,
  DeliveryDriverProfile,
  DeliveryTrackingEvent,
} from "@/types/models";

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
      `Server returned a non-JSON response. Check admin delivery assignment API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Admin delivery assignment request failed.");
  }

  return result;
}

export async function getAdminDeliveryAssignmentData(): Promise<{
  drivers: DeliveryDriverProfile[];
  assignments: DeliveryAssignment[];
  trackingEvents: DeliveryTrackingEvent[];
}> {
  const response = await fetch("/api/admin/delivery-assignments", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  return handleResponse(response);
}

export async function createDeliveryAssignment(payload: {
  orderId: string;
  driverId: string;
  assignmentType: string;
  pickupRegion?: string;
  pickupCity?: string;
  dropoffRegion?: string;
  dropoffCity?: string;
  pickupLat?: string;
  pickupLng?: string;
  dropoffLat?: string;
  dropoffLng?: string;
  routeNote?: string;
  adminNote?: string;
}) {
  const response = await fetch("/api/admin/delivery-assignments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateDeliveryAssignmentStatus(payload: {
  assignmentId: string;
  assignmentStatus: string;
  locationNote?: string;
  latitude?: string;
  longitude?: string;
}) {
  const response = await fetch("/api/admin/delivery-assignments", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}