"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { getAllProducts, StoreProduct } from "@/utils/productStorage";
import ProductVisual from "@/components/ProductVisual";
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
    const foundProduct =
      getAllProducts().find((item) => item.id === productId) || null;

    setProduct(foundProduct);
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

        <p className="mt-4 text-lg text-gray-600">{product.description}</p>

        <p className="mt-6 text-2xl font-bold text-gray-900">
          ${product.price.toFixed(2)}
        </p>

        <div className="mt-6">
          <AddToCartButton productId={product.id} />
        </div>
      </section>
    </main>
  );
}