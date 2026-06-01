import { SellerProfile } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

export type SellerStatusResponse = {
  isLoggedIn: boolean;
  seller: SellerProfile | null;
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

async function handleResponse(response: Response): Promise<SellerStatusResponse> {
  const text = await response.text();

  let result: SellerStatusResponse & { message?: string };

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check sellers API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Seller status request failed.");
  }

  return {
    isLoggedIn: Boolean(result.isLoggedIn),
    seller: result.seller || null,
  };
}

export async function getCurrentSellerStatus(): Promise<SellerStatusResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/sellers", {
    headers: authHeaders,
  });

  return handleResponse(response);
}