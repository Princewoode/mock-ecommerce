"use client";

import { useEffect, useState } from "react";
import { ProductReview } from "@/types/models";
import {
  deleteDatabaseReview,
  getAdminDatabaseReviews,
} from "@/utils/databaseReviewService";
import { getProductCatalog } from "@/utils/productCatalogService";

export default function AdminReviewManager() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [productNames, setProductNames] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      setIsLoading(true);

      const [databaseReviews, products] = await Promise.all([
        getAdminDatabaseReviews(),
        getProductCatalog(),
      ]);

      const names: Record<number, string> = {};

      products.forEach((product) => {
        names[product.id] = product.name;
      });

      setReviews(databaseReviews);
      setProductNames(names);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load database reviews."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteReview(reviewId: string) {
    try {
      await deleteDatabaseReview(reviewId);
      setMessage("Review deleted successfully.");
      await loadReviews();
      window.dispatchEvent(new Event("reviewsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete review."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Review Management
        </h2>

        <p className="mt-4 text-gray-600">Loading database reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Review Management
        </h2>

        {message && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-gray-700">
            {message}
          </div>
        )}

        <p className="mt-4 text-gray-600">
          No customer reviews have been submitted yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">Review Management</h2>

      <p className="mt-2 text-gray-600">
        Review and remove inappropriate product reviews from Supabase.
      </p>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <p className="font-semibold text-gray-900">
                  Product: {productNames[review.productId] || "Unknown Product"}
                </p>

                <p className="mt-1 text-gray-600">
                  Customer: {review.customerName}
                </p>

                <p className="mt-1 text-gray-600">
                  Email: {review.customerEmail}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {review.createdAt}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="font-semibold text-gray-900">
                  {"⭐".repeat(review.rating)}{" "}
                  <span className="text-gray-500">({review.rating}/5)</span>
                </p>

                <button
                  type="button"
                  onClick={() => handleDeleteReview(review.id)}
                  className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-red-600"
                >
                  Delete Review
                </button>
              </div>
            </div>

            <p className="mt-4 text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}