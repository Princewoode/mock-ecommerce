import { SellerProfile } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

function getAdminApiPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function getCustomerAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in before continuing.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(response: Response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Seller request failed.");
  }

  return result;
}

export async function submitSellerApplication(payload: {
  businessName: string;
  ownerName: string;
  phone: string;
  momoNumber: string;
  region: string;
  city: string;
  businessAddress: string;
  productCategories: string;
}) {
  const authHeaders = await getCustomerAuthHeaders();

  const response = await fetch("/api/sellers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function getAdminSellers(): Promise<SellerProfile[]> {
  const response = await fetch("/api/admin/sellers", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.sellers || [];
}

export async function updateSellerVerification({
  sellerId,
  status,
  verificationNote,
}: {
  sellerId: string;
  status: string;
  verificationNote: string;
}) {
  const response = await fetch("/api/admin/sellers", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify({
      sellerId,
      status,
      verificationNote,
    }),
  });

  return handleResponse(response);
}