import { DeliveryDriverProfile } from "@/types/models";

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
      `Server returned a non-JSON response. Check admin delivery driver API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Admin delivery driver request failed.");
  }

  return result;
}

export async function getAdminDeliveryDrivers(): Promise<DeliveryDriverProfile[]> {
  const response = await fetch("/api/admin/delivery-drivers", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.drivers || [];
}

export async function updateAdminDeliveryDriver({
  driverId,
  status,
  verificationNote,
  platformPhone,
}: {
  driverId: string;
  status: string;
  verificationNote?: string;
  platformPhone?: string;
}) {
  const response = await fetch("/api/admin/delivery-drivers", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify({
      driverId,
      status,
      verificationNote,
      platformPhone,
    }),
  });

  return handleResponse(response);
}