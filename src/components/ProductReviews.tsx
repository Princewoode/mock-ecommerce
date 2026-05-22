"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentCustomer } from "@/utils/authStorage";
import {
  addReview,
  deleteReview,
  getAverageRating,
  getReviewsByProduct,
  ProductReview,
} from "@/utils/reviewStorage";

type ProductReviewsProps = {
  productId: number;
};

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  const customer = getCurrentCustomer();

  useEffect(() => {
    function loadReviews() {
      setReviews(getReviewsByProduct(productId));
    }

    loadReviews();

    window.addEventListener("reviewsUpdated", loadReviews);

    return () => {
      window.removeEventListener("reviewsUpdated", loadReviews);
    };
  }, [productId]);

  const ratingData = getAverageRating(productId);

  const customerReview = customer
    ? reviews.find((review) => review.customerId === customer.id)
    : null;

  function handleSubmitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customer) {
      setMessage("Please login before leaving a review.");
      return;
    }

    if (customerReview) {
      setMessage("You have already reviewed this product.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write a short review comment.");
      return;
    }

    const newReview: ProductReview = {
      id: `RV-${Date.now()}`,
      productId,
      customerId: customer.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      rating: Number(rating),
      comment,
      createdAt: new Date().toLocaleString(),
    };

    addReview(newReview);

    setRating("5");
    setComment("");
    setMessage("Review submitted successfully.");
  }

  function handleDeleteOwnReview(reviewId: string) {
    deleteReview(reviewId);
    setMessage("Your review has been deleted.");
  }

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Reviews
          </h2>

          {ratingData.count === 0 ? (
            <p className="mt-2 text-gray-600">No reviews yet.</p>
          ) : (
            <p className="mt-2 text-gray-600">
              ⭐ {ratingData.average.toFixed(1)} / 5 based on{" "}
              {ratingData.count} review{ratingData.count === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>

      {!customer ? (
        <div className="mt-6 rounded-xl bg-gray-50 p-5">
          <p className="text-gray-600">
            Please login before leaving a product review.
          </p>

          <Link
            href="/account"
            className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white"
          >
            Login or Register
          </Link>
        </div>
      ) : customerReview ? (
        <div className="mt-6 rounded-xl bg-gray-50 p-5">
          <p className="font-semibold text-gray-900">
            You have already reviewed this product.
          </p>

          <button
            type="button"
            onClick={() => handleDeleteOwnReview(customerReview.id)}
            className="mt-4 rounded-lg border border-red-300 px-5 py-2 text-red-600"
          >
            Delete My Review
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="mt-6 space-y-5">
          {message && (
            <div className="rounded-lg bg-gray-50 p-4 text-gray-700">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rating
            </label>

            <select
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Review Comment
            </label>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share your experience with this product"
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-3 text-white"
          >
            Submit Review
          </button>
        </form>
      )}

      <div className="mt-8 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row">
              <div>
                <p className="font-semibold text-gray-900">
                  {review.customerName}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {review.createdAt}
                </p>
              </div>

              <p className="font-semibold text-gray-900">
                {"⭐".repeat(review.rating)}{" "}
                <span className="text-gray-500">({review.rating}/5)</span>
              </p>
            </div>

            <p className="mt-4 text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}