"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { StoreProduct } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { getProductCatalog } from "@/utils/productCatalogService";
import { hasValidGroupDeal } from "@/utils/productPricing";

export default function GroupDealsContent() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("biggest-discount");
  const [minimumQuantity, setMinimumQuantity] = useState("All");

  useEffect(() => {
    async function loadDeals() {
      setIsLoading(true);

      const catalog = await getProductCatalog();

      setProducts(catalog);
      setIsLoading(false);
    }

    loadDeals();

    window.addEventListener("productsUpdated", loadDeals);

    return () => {
      window.removeEventListener("productsUpdated", loadDeals);
    };
  }, []);

  const groupDealProducts = useMemo(() => {
    let deals = products.filter((product) => {
      const hasDeal = hasValidGroupDeal(product);
      const matchesMinimumQuantity =
        minimumQuantity === "All" ||
        Number(product.groupMinQuantity || 2) === Number(minimumQuantity);

      return hasDeal && matchesMinimumQuantity;
    });

    if (sortOrder === "biggest-discount") {
      deals = [...deals].sort((a, b) => {
        const aDiscount = a.price - Number(a.groupPrice || 0);
        const bDiscount = b.price - Number(b.groupPrice || 0);

        return bDiscount - aDiscount;
      });
    }

    if (sortOrder === "lowest-group-price") {
      deals = [...deals].sort(
        (a, b) => Number(a.groupPrice || 0) - Number(b.groupPrice || 0)
      );
    }

    if (sortOrder === "highest-stock") {
      deals = [...deals].sort((a, b) => b.stock - a.stock);
    }

    if (sortOrder === "newest") {
      deals = [...deals].sort((a, b) => b.id - a.id);
    }

    return deals;
  }, [products, sortOrder, minimumQuantity]);

  const minimumQuantityOptions = useMemo(() => {
    const quantities = Array.from(
      new Set(
        products
          .filter((product) => hasValidGroupDeal(product))
          .map((product) => product.groupMinQuantity || 2)
      )
    ).sort((a, b) => a - b);

    return ["All", ...quantities.map(String)];
  }, [products]);

  const dealStats = useMemo(() => {
    const totalSavings = groupDealProducts.reduce((sum, product) => {
      return sum + (product.price - Number(product.groupPrice || 0));
    }, 0);

    const lowestDealPrice =
      groupDealProducts.length > 0
        ? Math.min(
            ...groupDealProducts.map((product) => Number(product.groupPrice || 0))
          )
        : 0;

    return {
      dealCount: groupDealProducts.length,
      totalSavings,
      lowestDealPrice,
    };
  }, [groupDealProducts]);

  return (
    <>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 border-b pb-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Group and Bulk Deals
            </h2>

            <p className="mt-2 text-gray-600">
              Save more when buying with friends, family, resellers, or in bulk.
              These deals are useful for Ghana buyers who want lower prices
              through quantity-based purchasing.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-sm text-orange-700">Active Deals</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {dealStats.dealCount}
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-sm text-orange-700">Lowest Deal Price</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {dealStats.lowestDealPrice > 0
                  ? formatCurrency(dealStats.lowestDealPrice)
                  : "GH₵0.00"}
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-sm text-orange-700">Potential Unit Savings</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatCurrency(dealStats.totalSavings)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sort Deals
            </label>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="biggest-discount">Biggest Discount</option>
              <option value="lowest-group-price">Lowest Group Price</option>
              <option value="highest-stock">Highest Stock</option>
              <option value="newest">Newest Deals</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Quantity
            </label>

            <select
              value={minimumQuantity}
              onChange={(event) => setMinimumQuantity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {minimumQuantityOptions.map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity === "All" ? "All Quantities" : `${quantity}+ items`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading group deals...</p>
        </div>
      ) : groupDealProducts.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">
            No active group deals found yet. Admins and sellers can enable group
            deals from their product forms.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groupDealProducts.map((product) => (
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
    </>
  );
}