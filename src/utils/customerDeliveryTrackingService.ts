import {
  DeliveryAssignment,
  DeliveryTrackingEvent,
} from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

export type CustomerDeliveryTrackingOrder = {
  id: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  deliveryRegion: string;
  deliveryCity: string;
  deliveryPhone: string;
  courierName: string;
  courierPhone: string;
  trackingCode: string;
  adminNote: string;
  paymentStatus: string;
  escrowStatus: string;
};

export type CustomerDeliveryTrackingResponse = {
  order: CustomerDeliveryTrackingOrder;
  assignments: DeliveryAssignment[];
  trackingEvents: DeliveryTrackingEvent[];
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in to track delivery.");
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
      `Server returned a non-JSON response. Check customer delivery tracking API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Delivery tracking request failed.");
  }

  return result;
}

export async function getCustomerDeliveryTracking(
  orderId: string
): Promise<CustomerDeliveryTrackingResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `/api/customer/delivery-tracking?orderId=${encodeURIComponent(orderId)}`,
    {
      headers: authHeaders,
    }
  );

  return handleResponse(response);
}