"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import {
  SellerProfile,
  SellerTrustStats,
  StoreProduct,
} from "@/types/models";
import { getPublicSellerStorefront } from "@/utils/publicSellerService";

type SellerStorefrontContentProps = {
  sellerId: string;
};

export default function SellerStorefrontContent({
  sellerId,
}: SellerStorefrontContentProps) {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [trustStats, setTrustStats] = useState<SellerTrustStats | null>(null);
  const [message, setMessage] = useState("Loading seller storefront...");

  useEffect(() => {
    async function loadSeller() {
      try {
        const result = await getPublicSellerStorefront(sellerId);

        setSeller(result.seller);
        setProducts(result.products);
        setTrustStats(result.trustStats);
        setMessage("");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load seller storefront."
        );
      }
    }

    loadSeller();
  }, [sellerId]);

  if (message) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">{message}</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Seller not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Verified Ghana Seller
            </p>

            <h1 className="mt-3 text-4xl font-bold text-gray-900">
              {seller.businessName}
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              {seller.city}, {seller.region}
            </p>

            <p className="mt-3 max-w-3xl text-gray-600">
              Categories: {seller.productCategories}
            </p>

            <p className="mt-3 max-w-3xl text-gray-600">
              Business Address / Landmark: {seller.businessAddress}
            </p>

            <div className="mt-5 inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
              Verified Seller ✓
            </div>
          </div>

          {trustStats && (
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Seller Trust Score
              </p>

              <div className="mt-3 flex items-end gap-2">
                <p className="text-5xl font-bold text-gray-900">
                  {trustStats.trustScore}
                </p>

                <p className="pb-2 text-gray-500">/ 100</p>
              </div>

              <p className="mt-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-800">
                {trustStats.trustLabel}
              </p>

              <div className="mt-5 grid gap-3 text-sm text-gray-700">
                <p>
                  ⭐ Average Rating:{" "}
                  {trustStats.reviewCount > 0
                    ? `${trustStats.averageRating.toFixed(1)} / 5`
                    : "No reviews yet"}
                </p>

                <p>Reviews: {trustStats.reviewCount}</p>
                <p>Approved Products: {trustStats.approvedProductCount}</p>
                <p>Delivered Orders: {trustStats.deliveredOrders}</p>
                <p>Cancelled / Refunded Orders: {trustStats.cancelledOrders}</p>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Trust score is based on verified status, product reviews,
                delivered orders, and cancellation/refund history.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Products from {seller.businessName}
        </h2>

        {products.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">
              This seller has no approved public products yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
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
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}