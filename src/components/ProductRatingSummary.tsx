"use client";

import { useEffect, useState } from "react";
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
    function loadRating() {
      const ratingData = getAverageRating(productId);

      setAverageRating(ratingData.average);
      setReviewCount(ratingData.count);
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