"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { StoreProduct } from "@/types/models";
import { getProductCatalog } from "@/utils/productCatalogService";
import { ghanaMarketplaceCategories } from "@/utils/ghanaMarketplaceCategories";
import { formatCurrency } from "@/utils/currency";

export default function HomeMarketplaceContent() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);

      const catalog = await getProductCatalog();

      setProducts(catalog);
      setIsLoading(false);
    }

    loadProducts();

    window.addEventListener("productsUpdated", loadProducts);

    return () => {
      window.removeEventListener("productsUpdated", loadProducts);
    };
  }, []);

  const featuredProducts = useMemo(() => {
    return [...products]
      .filter((product) => product.stock > 0)
      .sort((a, b) => b.id - a.id)
      .slice(0, 6);
  }, [products]);

  const marketplaceStats = useMemo(() => {
    const sellerNames = new Set(
      products
        .map((product) => product.sellerBusinessName)
        .filter(Boolean)
    );

    const totalStock = products.reduce((sum, product) => {
      return sum + product.stock;
    }, 0);

    const lowestPrice =
      products.length > 0
        ? Math.min(...products.map((product) => product.price))
        : 0;

    return {
      productCount: products.length,
      sellerCount: sellerNames.size,
      totalStock,
      lowestPrice,
    };
  }, [products]);

  const categoryHighlights = ghanaMarketplaceCategories.slice(0, 8);

  return (
    <>
      <section className="rounded-3xl bg-black px-6 py-12 text-white shadow-sm md:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">
              Ghana Social Marketplace
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Buy from verified Ghana sellers with MoMo-friendly checkout.
            </h1>

            <p className="mt-5 max-w-3xl text-lg text-gray-200">
              Discover products from boutiques, small traders, importers,
              wholesalers, and local producers. Payments can be held through an
              escrow-style workflow until delivery and buyer confirmation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-black"
              >
                Start Shopping
              </Link>

              <Link
                href="/seller/apply"
                className="rounded-xl border border-white px-6 py-3 text-center font-semibold text-white"
              >
                Become a Seller
              </Link>

              <Link
                href="/categories"
                className="rounded-xl border border-gray-500 px-6 py-3 text-center font-semibold text-white"
              >
                Browse Categories
              </Link>
              <Link
  href="/deals"
  className="rounded-xl border border-orange-300 px-6 py-3 text-center font-semibold text-white"
>
  View Group Deals
</Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">
                  {marketplaceStats.productCount}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Approved public products
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">
                  {marketplaceStats.sellerCount}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Active marketplace sellers
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">
                  {marketplaceStats.lowestPrice > 0
                    ? formatCurrency(marketplaceStats.lowestPrice)
                    : "GH₵"}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Starting product price
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-gray-900">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Built for Ghana commerce
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="font-bold text-gray-900">
                  MTN MoMo, Telecel Cash, ATMoney
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Payment confirmation foundation ready for Ghana mobile money
                  workflows.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="font-bold text-gray-900">
                  Verified seller storefronts
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Buyers can inspect seller profile, trust score, location, and
                  approved products.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="font-bold text-gray-900">
                  Escrow-style buyer protection
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Refund, dispute, delivery confirmation, and payout tracking
                  are already part of the platform flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Payment</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">
            MoMo-first checkout
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Ghana-friendly payment capture with reference tracking.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Trust</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">
            Verified sellers
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Seller approval, product review, and trust scores.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Delivery</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">
            Ghana delivery zones
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Accra, Tema, Kumasi, Takoradi, Tamale, Cape Coast, and regional
            towns.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Protection</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">
            Refunds and disputes
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Buyer actions and admin review workflows are included.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Shop by category
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Popular Ghana marketplace categories
            </h2>

            <p className="mt-2 max-w-3xl text-gray-600">
              Built for fashion traders, phone accessory sellers, beauty shops,
              groceries, wholesalers, and local producers.
            </p>
          </div>

          <Link
            href="/categories"
            className="rounded-lg border border-gray-300 px-5 py-2 text-center font-medium text-gray-900"
          >
            View All Categories
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryHighlights.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-gray-900">
                {category.name}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {category.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {category.examples.slice(0, 2).map((example) => (
                  <span
                    key={example}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Featured listings
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Latest approved products
            </h2>

            <p className="mt-2 max-w-3xl text-gray-600">
              New products from verified sellers and platform-managed listings.
            </p>
          </div>

          <Link
            href="/products"
            className="rounded-lg bg-black px-5 py-2 text-center font-medium text-white"
          >
            Shop All Products
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Loading featured products...</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">
              No approved products available yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
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
        )}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            For sellers
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            Sell to Ghana buyers with a verified storefront.
          </h2>

          <p className="mt-4 text-gray-600">
            Small sellers, boutiques, wholesalers, importers, and local
            producers can apply, upload products, receive order notifications,
            and track payouts.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
             href="/seller/dashboard"
              className="rounded-lg bg-black px-6 py-3 text-center text-white"
            >
              Start Selling
            </Link>

            <Link
              href="/seller/dashboard"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
            >
              Seller Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            For buyers
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            Track orders, payment status, delivery, refunds, and disputes.
          </h2>

          <p className="mt-4 text-gray-600">
            Buyers can view order history, payment confirmation, escrow status,
            courier updates, delivery confirmation, refund requests, and dispute
            progress.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/orders"
              className="rounded-lg bg-black px-6 py-3 text-center text-white"
            >
              View Orders
            </Link>
<Link
  href="/buyer/dashboard"
  className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
>
  Buyer Dashboard
</Link>
            <Link
              href="/notifications"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
            >
              View Notifications
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}