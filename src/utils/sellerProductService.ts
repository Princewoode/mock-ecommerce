import { StoreProduct } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

export type SellerProduct = StoreProduct & {
  isDefault?: boolean;
};

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in before accessing seller tools.");
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
      `Server returned a non-JSON response. Check that /api/seller/products exists and restart the dev server. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Seller product request failed.");
  }

  return result;
}

export async function getSellerProducts(): Promise<SellerProduct[]> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/seller/products", {
    headers: {
      ...authHeaders,
    },
  });

  const result = await handleResponse(response);

  return result.products || [];
}

export async function createSellerProduct(payload: {
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/seller/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateSellerProduct(payload: {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/seller/products", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function deleteSellerProduct(productId: number) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`/api/seller/products?id=${productId}`, {
    method: "DELETE",
    headers: {
      ...authHeaders,
    },
  });

  return handleResponse(response);
}