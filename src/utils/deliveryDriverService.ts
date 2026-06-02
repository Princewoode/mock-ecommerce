import { DeliveryDriverProfile } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

export type DriverStatusResponse = {
  isLoggedIn: boolean;
  driver: DeliveryDriverProfile | null;
};

export type DriverApplicationPayload = {
  fullName: string;
  phone: string;
  momoNumber: string;
  region: string;
  city: string;
  vehicleType: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  ghanaCardReference?: string;
  intraCityZones?: string;
  interCityRoutes?: string;
  availability?: string;
  emergencyContact?: string;
  driverNote?: string;
};

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

async function handleResponse(response: Response) {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check delivery driver API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Delivery driver request failed.");
  }

  return result;
}

export async function getCurrentDriverStatus(): Promise<DriverStatusResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/delivery/drivers", {
    headers: authHeaders,
  });

  return handleResponse(response);
}

export async function submitDriverApplication(
  payload: DriverApplicationPayload
) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/delivery/drivers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}