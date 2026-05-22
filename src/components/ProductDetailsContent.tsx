"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { StoreProduct } from "@/types/models";
import { getProductCatalog } from "@/utils/productCatalogService";
import ProductVisual from "@/components/ProductVisual";
import ProductReviews from "@/components/ProductReviews";
import ProductRatingSummary from "@/components/ProductRatingSummary";
type ProductDetailsContentProps = {
  productId: number;
};

export default function ProductDetailsContent({
  productId,
}: ProductDetailsContentProps) {
  const [product, setProduct] = useState<StoreProduct | null | undefined>(
    undefined
  );

  useEffect(() => {
  async function loadProduct() {
    const products = await getProductCatalog();
    const foundProduct =
      products.find((item) => item.id === productId) || null;

    setProduct(foundProduct);
  }

  loadProduct();

  window.addEventListener("productsUpdated", loadProduct);

  return () => {
    window.removeEventListener("productsUpdated", loadProduct);
  };
}, [productId]);

  if (product === undefined) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-gray-600">Loading product...</p>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Product Not Found
          </h1>

          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
          >
            Back to Products
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6">
          <ProductVisual image={product.image} alt={product.name} size="large" />
        </div>

        <p className="text-sm text-gray-500">{product.category}</p>

        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          {product.name}
        </h1>
<ProductRatingSummary productId={product.id} />
        <p className="mt-4 text-lg text-gray-600">{product.description}</p>

        <p className="mt-6 text-2xl font-bold text-gray-900">
  ${product.price.toFixed(2)}
</p>

<p
  className={`mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
    product.stock <= 0
      ? "bg-red-50 text-red-700"
      : product.stock <= 3
        ? "bg-yellow-50 text-yellow-700"
        : "bg-green-50 text-green-700"
  }`}
>
  {product.stock <= 0
    ? "Out of Stock"
    : product.stock <= 3
      ? `Low Stock: ${product.stock} left`
      : `In Stock: ${product.stock} available`}
</p>

<div className="mt-6">
  {product.stock > 0 ? (
    <AddToCartButton productId={product.id} />
  ) : (
    <button
      type="button"
      disabled
      className="rounded-lg bg-gray-200 px-5 py-2 text-gray-500"
    >
      Unavailable
    </button>
  )}
</div>
           </section>

      <section className="mx-auto max-w-3xl">
        <ProductReviews productId={product.id} />
      </section>
    </main>
  );
}