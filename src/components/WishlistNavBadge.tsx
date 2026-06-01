"use client";

import { useEffect, useState } from "react";
import { getWishlistCount } from "@/utils/wishlistStorage";

export default function WishlistNavBadge() {
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    function loadWishlistCount() {
      setWishlistCount(getWishlistCount());
    }

    loadWishlistCount();

    window.addEventListener("wishlistUpdated", loadWishlistCount);
    window.addEventListener("storage", loadWishlistCount);

    return () => {
      window.removeEventListener("wishlistUpdated", loadWishlistCount);
      window.removeEventListener("storage", loadWishlistCount);
    };
  }, []);

  if (wishlistCount <= 0) {
    return null;
  }

  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
      {wishlistCount > 99 ? "99+" : wishlistCount}
    </span>
  );
}