"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StoreProduct } from "@/types/models";
import { getProductCatalog } from "@/utils/productCatalogService";
import { ghanaMarketplaceCategories } from "@/utils/ghanaMarketplaceCategories";

export default function CategoryBrowseContent() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setProducts(await getProductCatalog());
      setIsLoading(false);
    }

    loadProducts();
  }, []);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((counts, product) => {
      counts[product.category] = (counts[product.category] || 0) + 1;
      return counts;
    }, {});
  }, [products]);

  return (
    <div className="mt-8">
      {isLoading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading categories...</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ghanaMarketplaceCategories.map((category) => {
            const productCount = categoryCounts[category.name] || 0;

            return (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {category.name}
                    </h2>

                    <p className="mt-2 text-gray-600">
                      {category.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    {productCount}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {category.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600"
                    >
                      {example}
                    </span>
                  ))}
                </div>

                <p className="mt-5 text-sm font-semibold text-blue-700">
                  Browse {category.name} →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}