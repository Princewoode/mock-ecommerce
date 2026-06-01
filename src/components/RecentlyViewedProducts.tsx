"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { StoreProduct } from "@/types/models";
import { getProductCatalog } from "@/utils/productCatalogService";
import {
  clearRecentlyViewedProducts,
  getRecentlyViewedProductIds,
} from "@/utils/recentlyViewedStorage";

type RecentlyViewedProductsProps = {
  excludeProductId?: number;
  limit?: number;
  compact?: boolean;
};

export default function RecentlyViewedProducts({
  excludeProductId,
  limit = 6,
  compact = false,
}: RecentlyViewedProductsProps) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecentlyViewed() {
      setIsLoading(true);

      setProducts(await getProductCatalog());
      setRecentIds(getRecentlyViewedProductIds());

      setIsLoading(false);
    }

    loadRecentlyViewed();

    window.addEventListener("recentlyViewedUpdated", loadRecentlyViewed);
    window.addEventListener("productsUpdated", loadRecentlyViewed);

    return () => {
      window.removeEventListener("recentlyViewedUpdated", loadRecentlyViewed);
      window.removeEventListener("productsUpdated", loadRecentlyViewed);
    };
  }, []);

  const recentlyViewedProducts = useMemo(() => {
    return recentIds
      .filter((productId) => productId !== excludeProductId)
      .map((productId) => products.find((product) => product.id === productId))
      .filter((product): product is StoreProduct => Boolean(product))
      .slice(0, limit);
  }, [recentIds, products, excludeProductId, limit]);

  function handleClearRecentlyViewed() {
    clearRecentlyViewedProducts();
    setRecentIds([]);
    window.dispatchEvent(new Event("recentlyViewedUpdated"));
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading recently viewed products...</p>
      </div>
    );
  }

  if (recentlyViewedProducts.length === 0) {
    if (compact) {
      return null;
    }

    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">
          No recently viewed products yet. Open product details to start building
          your browsing history.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-10">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Recently Viewed Products
          </h2>

          <p className="mt-2 text-gray-600">
            Continue from products you checked earlier. Useful for comparing
            sellers, prices, group deals, and WhatsApp sharing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearRecentlyViewed}
          className="rounded-lg border border-red-300 px-5 py-2 text-red-600"
        >
          Clear History
        </button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recentlyViewedProducts.map((product) => (
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
    </section>
  );
}