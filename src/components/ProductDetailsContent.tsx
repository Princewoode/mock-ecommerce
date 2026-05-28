"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import ProductReviews from "@/components/ProductReviews";
import ProductVisual from "@/components/ProductVisual";
import ProductRatingSummary from "@/components/ProductRatingSummary";
import { StoreProduct } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { getProductCatalog } from "@/utils/productCatalogService";

type ProductDetailsContentProps = {
  productId: number;
};

export default function ProductDetailsContent({
  productId,
}: ProductDetailsContentProps) {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);

      const products = await getProductCatalog();
      const foundProduct =
        products.find((item) => item.id === productId) || null;

      setProduct(foundProduct);
      setIsLoading(false);
    }

    loadProduct();

    window.addEventListener("productsUpdated", loadProduct);

    return () => {
      window.removeEventListener("productsUpdated", loadProduct);
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Product not found or not approved.</p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <>
      <div className="mt-8 grid gap-8 rounded-3xl bg-white p-8 shadow-sm lg:grid-cols-[1fr_1.2fr]">
        <ProductVisual image={product.image} alt={product.name} size="large" />

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {product.category}
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            {product.name}
          </h1>

          {product.sellerBusinessName && product.sellerId && (
            <Link
              href={`/sellers/${product.sellerId}`}
              className="mt-3 inline-block rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:underline"
            >
              Verified Seller: {product.sellerBusinessName} ✓
            </Link>
          )}

          {product.sellerBusinessName && !product.sellerId && (
            <p className="mt-3 text-sm font-semibold text-gray-600">
              Sold by {product.sellerBusinessName}
            </p>
          )}

          <ProductRatingSummary productId={product.id} />

          <p className="mt-5 text-gray-700">{product.description}</p>

          <p className="mt-6 text-3xl font-bold text-gray-900">
            {formatCurrency(product.price)}
          </p>

          <p
            className={`mt-4 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
              isOutOfStock
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {isOutOfStock
              ? "Out of Stock"
              : `Available Stock: ${product.stock}`}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
            >
              Back to Products
            </Link>

            {!isOutOfStock && <AddToCartButton productId={product.id} />}
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </>
  );
}