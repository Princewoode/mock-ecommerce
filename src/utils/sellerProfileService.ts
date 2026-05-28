import { SellerProfile } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in before accessing seller profile.");
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
      `Server returned a non-JSON response. Check that /api/seller/profile exists and restart the dev server. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Seller profile request failed.");
  }

  return result;
}

export async function getSellerProfile(): Promise<SellerProfile> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/seller/profile", {
    headers: {
      ...authHeaders,
    },
  });

  const result = await handleResponse(response);

  return result.seller;
}

export async function updateSellerProfile(payload: {
  storeDescription: string;
  logoUrl: string;
  bannerUrl: string;
}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/seller/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function uploadSellerImage(file: File): Promise<string> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch("/api/uploads/seller-image", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Seller image upload failed.");
  }

  return result.imageUrl;
}