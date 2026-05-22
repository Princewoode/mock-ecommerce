"use client";

import { useEffect, useState } from "react";
import { getDatabaseReviewsByProduct } from "@/utils/databaseReviewService";
import { getAverageRating } from "@/utils/reviewStorage";

type ProductRatingSummaryProps = {
  productId: number;
};

export default function ProductRatingSummary({
  productId,
}: ProductRatingSummaryProps) {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    async function loadRating() {
      try {
        const reviews = await getDatabaseReviewsByProduct(productId);

        if (reviews.length === 0) {
          setAverageRating(0);
          setReviewCount(0);
          return;
        }

        const total = reviews.reduce((sum, review) => sum + review.rating, 0);

        setAverageRating(total / reviews.length);
        setReviewCount(reviews.length);
      } catch {
        const fallbackRating = getAverageRating(productId);

        setAverageRating(fallbackRating.average);
        setReviewCount(fallbackRating.count);
      }
    }

    loadRating();

    window.addEventListener("reviewsUpdated", loadRating);

    return () => {
      window.removeEventListener("reviewsUpdated", loadRating);
    };
  }, [productId]);

  if (reviewCount === 0) {
    return <p className="mt-3 text-sm text-gray-500">No reviews yet</p>;
  }

  return (
    <p className="mt-3 text-sm text-gray-600">
      ⭐ {averageRating.toFixed(1)} / 5 · {reviewCount} review
      {reviewCount === 1 ? "" : "s"}
    </p>
  );
}