import {
  DeliveryAssignment,
  DeliveryDriverProfile,
  DeliveryHub,
} from "@/types/models";

const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

type MultiLegDispatchResponse = {
  message?: string;
  drivers?: DeliveryDriverProfile[];
  hubs?: DeliveryHub[];
  assignments?: DeliveryAssignment[];
};

function getAdminApiPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function handleResponse(
  response: Response
): Promise<MultiLegDispatchResponse> {
  const text = await response.text();

  let result: MultiLegDispatchResponse;

  try {
    result = JSON.parse(text) as MultiLegDispatchResponse;
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check multi-leg dispatch API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Multi-leg dispatch request failed.");
  }

  return result;
}

export async function getMultiLegDispatchData(): Promise<{
  drivers: DeliveryDriverProfile[];
  hubs: DeliveryHub[];
  assignments: DeliveryAssignment[];
}> {
  const response = await fetch("/api/admin/multi-leg-dispatch", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return {
    drivers: result.drivers || [],
    hubs: result.hubs || [],
    assignments: result.assignments || [],
  };
}

export async function createMultiLegDeliveryLeg(payload: {
  orderId: string;
  driverId: string;
  assignmentType: string;
  originHubId?: string;
  destinationHubId?: string;
  pickupRegion?: string;
  pickupCity?: string;
  dropoffRegion?: string;
  dropoffCity?: string;
  routeNote?: string;
  adminNote?: string;
}) {
  const response = await fetch("/api/admin/multi-leg-dispatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify({
      action: "create-leg",
      ...payload,
    }),
  });

  return handleResponse(response);
}

export async function recordDeliveryHubHandover(payload: {
  fromAssignmentId: string;
  toAssignmentId?: string;
  hubId: string;
  eventType: string;
  eventNote?: string;
}) {
  const response = await fetch("/api/admin/multi-leg-dispatch", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify({
      action: "record-handover",
      ...payload,
    }),
  });

  return handleResponse(response);
}