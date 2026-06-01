"use client";

import { useEffect, useState } from "react";
import {
  isProductInWishlist,
  toggleProductWishlist,
} from "@/utils/wishlistStorage";

type WishlistButtonProps = {
  productId: number;
};

export default function WishlistButton({ productId }: WishlistButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    function syncWishlistState() {
      setIsSaved(isProductInWishlist(productId));
    }

    syncWishlistState();

    window.addEventListener("wishlistUpdated", syncWishlistState);

    return () => {
      window.removeEventListener("wishlistUpdated", syncWishlistState);
    };
  }, [productId]);

  function handleToggleWishlist() {
    const saved = toggleProductWishlist(productId);

    setIsSaved(saved);
    window.dispatchEvent(new Event("wishlistUpdated"));
  }

  return (
    <button
      type="button"
      onClick={handleToggleWishlist}
      className={`w-full rounded-lg border px-4 py-2 text-sm font-semibold ${
        isSaved
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-gray-300 text-gray-800 hover:bg-gray-50"
      }`}
    >
      {isSaved ? "Saved ♥" : "Save ♡"}
    </button>
  );
}