import { Order } from "@/types/models";

const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

function getAdminApiPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function handleResponse(response: Response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Database order request failed.");
  }

  return result;
}

export async function getCustomerDatabaseOrders({
  email,
  customerId,
}: {
  email: string;
  customerId?: string;
}): Promise<Order[]> {
  const params = new URLSearchParams();

  if (customerId) {
    params.set("customerId", customerId);
  } else {
    params.set("email", email);
  }

  const response = await fetch(`/api/customer/orders?${params.toString()}`);
  const result = await handleResponse(response);

  return result.orders || [];
}

export async function getAdminDatabaseOrders(): Promise<Order[]> {
  const response = await fetch("/api/admin/orders", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.orders || [];
}

export async function updateDatabaseOrderDetails({
  orderId,
  status,
  courierName,
  courierPhone,
  trackingCode,
  adminNote,
}: {
  orderId: string;
  status: string;
  courierName?: string;
  courierPhone?: string;
  trackingCode?: string;
  adminNote?: string;
}) {
  const response = await fetch("/api/admin/orders", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify({
      orderId,
      status,
      courierName,
      courierPhone,
      trackingCode,
      adminNote,
    }),
  });

  return handleResponse(response);
}

export async function deleteDatabaseOrder(orderId: string) {
  const response = await fetch(`/api/admin/orders?id=${orderId}`, {
    method: "DELETE",
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  return handleResponse(response);
}