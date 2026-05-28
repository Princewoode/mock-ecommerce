"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { SellerProfile, StoreProduct } from "@/types/models";
import { getPublicSellerStorefront } from "@/utils/publicSellerService";

type SellerStorefrontContentProps = {
  sellerId: string;
};

export default function SellerStorefrontContent({
  sellerId,
}: SellerStorefrontContentProps) {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [message, setMessage] = useState("Loading seller storefront...");

  useEffect(() => {
    async function loadSeller() {
      try {
        const result = await getPublicSellerStorefront(sellerId);

        setSeller(result.seller);
        setProducts(result.products);
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
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
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
          </div>

          <div className="rounded-2xl bg-green-50 px-5 py-4 text-green-800">
            <p className="font-bold">Verified Seller</p>
            <p className="mt-1 text-sm">
              This seller has been reviewed by marketplace admin.
            </p>
          </div>
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