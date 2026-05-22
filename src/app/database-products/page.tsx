"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { StoreProduct } from "@/types/models";
import { getSupabaseProducts } from "@/utils/supabaseProductService";

export default function DatabaseProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [message, setMessage] = useState("Loading database products...");

  useEffect(() => {
    async function loadProducts() {
      try {
        const databaseProducts = await getSupabaseProducts();

        setProducts(databaseProducts);
        setMessage("");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load database products."
        );
      }
    }

    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Supabase Product Test
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Database Products
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            These products are loaded directly from Supabase.
          </p>
        </div>

        {message && (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}