import { supabase } from "@/lib/supabaseClient";

export type DriverDeliveryAssignment = {
  id: string;
  orderId: string;
  assignmentType: string;
  assignmentStatus: string;
  pickupRegion: string;
  pickupCity: string;
  dropoffRegion: string;
  dropoffCity: string;
  routeNote: string;
  adminNote: string;
  assignedAt: string;
  updatedAt: string;
  order: {
    id: string;
    status: string;
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    deliveryRegion: string;
    deliveryCity: string;
    deliveryPhone: string;
    deliveryFee: number;
    paymentStatus: string;
    escrowStatus: string;
    trackingCode: string;
    adminNote: string;
    createdAt: string;
  } | null;
};

export type DriverDeliveryResponse = {
  driver: {
    id: string;
    fullName: string;
    phone: string;
    platformPhone: string;
    region: string;
    city: string;
    vehicleType: string;
    vehicleNumber: string;
  };
  assignments: DriverDeliveryAssignment[];
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in before viewing driver deliveries.");
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
      `Server returned a non-JSON response. Check driver deliveries API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Driver delivery request failed.");
  }

  return result;
}

export async function getDriverDeliveries(): Promise<DriverDeliveryResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/driver/deliveries", {
    headers: authHeaders,
  });

  return handleResponse(response);
}

export async function updateDriverDeliveryStatus({
  assignmentId,
  assignmentStatus,
  locationNote,
}: {
  assignmentId: string;
  assignmentStatus: string;
  locationNote?: string;
}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/driver/deliveries", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      assignmentId,
      assignmentStatus,
      locationNote,
    }),
  });

  return handleResponse(response);
}