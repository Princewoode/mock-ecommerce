"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { StoreProduct } from "@/types/models";
import { getProductCatalog } from "@/utils/productCatalogService";
import {
  clearWishlist,
  getWishlistProductIds,
} from "@/utils/wishlistStorage";

export default function WishlistContent() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      setIsLoading(true);

      setProducts(await getProductCatalog());
      setWishlistIds(getWishlistProductIds());

      setIsLoading(false);
    }

    loadWishlist();

    window.addEventListener("wishlistUpdated", loadWishlist);
    window.addEventListener("productsUpdated", loadWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", loadWishlist);
      window.removeEventListener("productsUpdated", loadWishlist);
    };
  }, []);

  const wishlistProducts = useMemo(() => {
    return products.filter((product) => wishlistIds.includes(product.id));
  }, [products, wishlistIds]);

  function handleClearWishlist() {
    clearWishlist();
    setWishlistIds([]);
    window.dispatchEvent(new Event("wishlistUpdated"));
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading saved products...</p>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">
          You have not saved any products yet.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded-lg bg-black px-6 py-3 text-center text-white"
          >
            Browse Products
          </Link>

          <Link
            href="/deals"
            className="rounded-lg border border-orange-300 px-6 py-3 text-center text-orange-700"
          >
            Browse Group Deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Saved Products
            </h2>

            <p className="mt-2 text-gray-600">
              Products you saved for later. Compare prices, share with friends,
              or return when ready to pay.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearWishlist}
            className="rounded-lg border border-red-300 px-5 py-2 text-red-600"
          >
            Clear Wishlist
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {wishlistProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            category={product.category}
            description={product.description}
            price={product.price}
            image={product.image}
            stock={product.stock}
            sellerId={product.sellerId}
            sellerBusinessName={product.sellerBusinessName}
            groupDealEnabled={product.groupDealEnabled}
            groupPrice={product.groupPrice}
            groupMinQuantity={product.groupMinQuantity}
            groupDealNote={product.groupDealNote}
          />
        ))}
      </div>
    </>
  );
}