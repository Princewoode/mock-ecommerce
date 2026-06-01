"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import AddGroupDealButton from "@/components/AddGroupDealButton";
import ProductReviews from "@/components/ProductReviews";
import ProductVisual from "@/components/ProductVisual";
import ProductRatingSummary from "@/components/ProductRatingSummary";
import { StoreProduct } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { getProductCatalog } from "@/utils/productCatalogService";
import WishlistButton from "@/components/WishlistButton";
import { hasValidGroupDeal } from "@/utils/productPricing";
import RecentlyViewedProducts from "@/components/RecentlyViewedProducts";
import { recordProductView } from "@/utils/recentlyViewedStorage";
import ShareProductButton from "@/components/ShareProductButton";
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

if (foundProduct) {
  recordProductView(foundProduct.id);
}

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
  const hasGroupDeal = hasValidGroupDeal(product);
  const groupSavings = hasGroupDeal
    ? product.price - Number(product.groupPrice || 0)
    : 0;

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

          <div className="mt-6">
            {hasGroupDeal ? (
              <>
                <p className="text-sm text-gray-500 line-through">
                  Normal price: {formatCurrency(product.price)}
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  Group price: {formatCurrency(Number(product.groupPrice))}
                </p>

                <p className="mt-2 text-sm font-semibold text-orange-700">
                  Save {formatCurrency(groupSavings)} per item when you buy{" "}
                  {product.groupMinQuantity || 2}+ item(s).
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(product.price)}
              </p>
            )}
          </div>

          {hasGroupDeal && (
            <div className="mt-5 rounded-2xl bg-orange-50 p-5">
              <p className="font-bold text-orange-900">
                Group / Bulk Deal Available
              </p>

              <p className="mt-2 text-sm text-orange-800">
                Click <strong>Add Group Deal</strong> to automatically add{" "}
                {product.groupMinQuantity || 2} item(s) and unlock the cheaper
                group price.
              </p>

              {product.groupDealNote && (
                <p className="mt-2 text-sm text-orange-800">
                  {product.groupDealNote}
                </p>
              )}

              <p className="mt-3 text-xs text-orange-700">
                Useful for friends buying together, families, traders,
                resellers, boutiques, and small wholesalers.
              </p>
            </div>
          )}

          <p
            className={`mt-5 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
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
<WishlistButton productId={product.id} />
            {!isOutOfStock && <AddToCartButton productId={product.id} />}

            {hasGroupDeal && !isOutOfStock && (
              <AddGroupDealButton
                productId={product.id}
                groupMinQuantity={product.groupMinQuantity || 2}
                stock={product.stock}
              />
            )}

            {hasGroupDeal && (
              <Link
                href="/deals"
                className="rounded-lg border border-orange-300 px-6 py-3 text-center text-orange-700"
              >
                View More Deals
              </Link>
            )}
          </div>
          <div className="mt-5">
  <ShareProductButton
    productId={product.id}
    productName={product.name}
    price={product.price}
    sellerBusinessName={product.sellerBusinessName}
    groupDealEnabled={product.groupDealEnabled}
    groupPrice={product.groupPrice}
    groupMinQuantity={product.groupMinQuantity}
  />
</div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
      <RecentlyViewedProducts
  excludeProductId={product.id}
  limit={3}
  compact
/>
    </>
  );
}