import {
  SellerProfile,
  SellerTrustStats,
  StoreProduct,
} from "@/types/models";

async function handleResponse(response: Response) {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check public seller API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Failed to load seller storefront.");
  }

  return result;
}

export async function getPublicSellerStorefront(
  sellerId: string
): Promise<{
  seller: SellerProfile;
  products: StoreProduct[];
  trustStats: SellerTrustStats;
}> {
  const response = await fetch(`/api/public/sellers/${sellerId}`);

  return handleResponse(response);
}