import { StoreProduct } from "@/types/models";

export type AdminProduct = StoreProduct & {
  isDefault: boolean;
};

type ProductPayload = {
  id?: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
};

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
    throw new Error(result.message || "Admin product request failed.");
  }

  return result;
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const response = await fetch("/api/admin/products", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.products || [];
}

export async function createAdminProduct(payload: ProductPayload) {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateAdminProduct(payload: ProductPayload) {
  const response = await fetch("/api/admin/products", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function deleteAdminProduct(productId: number) {
  const response = await fetch(`/api/admin/products?id=${productId}`, {
    method: "DELETE",
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  return handleResponse(response);
}