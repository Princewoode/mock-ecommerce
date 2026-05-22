import { ProductReview } from "@/types/models";

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
    throw new Error(result.message || "Database review request failed.");
  }

  return result;
}

export async function getDatabaseReviewsByProduct(
  productId: number
): Promise<ProductReview[]> {
  const response = await fetch(`/api/reviews?productId=${productId}`);

  const result = await handleResponse(response);

  return result.reviews || [];
}

export async function createDatabaseReview(review: ProductReview) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  });

  return handleResponse(response);
}

export async function getAdminDatabaseReviews(): Promise<ProductReview[]> {
  const response = await fetch("/api/admin/reviews", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.reviews || [];
}

export async function deleteDatabaseReview(reviewId: string) {
  const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
    method: "DELETE",
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  return handleResponse(response);
}