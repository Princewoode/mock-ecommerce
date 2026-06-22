import { DeliveryHub } from "@/types/models";

const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

type DeliveryHubApiResponse = {
  message?: string;
  hubs?: DeliveryHub[];
  hub?: DeliveryHub;
};

function getAdminApiPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function handleResponse(
  response: Response
): Promise<DeliveryHubApiResponse> {
  const text = await response.text();

  let result: DeliveryHubApiResponse;

  try {
    result = JSON.parse(text) as DeliveryHubApiResponse;
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check admin delivery hub API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Admin delivery hub request failed.");
  }

  return result;
}

export async function getAdminDeliveryHubs(): Promise<DeliveryHub[]> {
  const response = await fetch("/api/admin/delivery-hubs", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.hubs || [];
}

export async function createAdminDeliveryHub(payload: {
  hubName: string;
  hubType: string;
  region: string;
  city: string;
  address?: string;
  contactPhone?: string;
  managerName?: string;
  managerPhone?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  adminNote?: string;
}) {
  const response = await fetch("/api/admin/delivery-hubs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateAdminDeliveryHub(payload: {
  hubId: string;
  hubName: string;
  hubType: string;
  region: string;
  city: string;
  address?: string;
  contactPhone?: string;
  managerName?: string;
  managerPhone?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  isActive: boolean;
  adminNote?: string;
}) {
  const response = await fetch("/api/admin/delivery-hubs", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}