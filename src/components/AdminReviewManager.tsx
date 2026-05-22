"use client";

import { useEffect, useState } from "react";
import {
  deleteReview,
  getReviews,
  ProductReview,
} from "@/utils/reviewStorage";
import { getAllProducts } from "@/utils/productStorage";

export default function AdminReviewManager() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  useEffect(() => {
    loadReviews();

    window.addEventListener("reviewsUpdated", loadReviews);

    return () => {
      window.removeEventListener("reviewsUpdated", loadReviews);
    };
  }, []);

  function loadReviews() {
    setReviews(getReviews());
  }

  function handleDeleteReview(reviewId: string) {
    deleteReview(reviewId);
  }

  function getProductName(productId: number) {
    const product = getAllProducts().find((item) => item.id === productId);

    return product ? product.name : "Unknown Product";
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Review Management
        </h2>

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
        Review and remove inappropriate product reviews.
      </p>

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <p className="font-semibold text-gray-900">
                  Product: {getProductName(review.productId)}
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