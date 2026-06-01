import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import AddGroupDealButton from "@/components/AddGroupDealButton";
import ProductVisual from "@/components/ProductVisual";
import ProductRatingSummary from "@/components/ProductRatingSummary";
import { formatCurrency } from "@/utils/currency";

type ProductCardProps = {
  id?: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
  stock?: number;
  sellerId?: string;
  sellerBusinessName?: string;
  groupDealEnabled?: boolean;
  groupPrice?: number;
  groupMinQuantity?: number;
  groupDealNote?: string;
};

export default function ProductCard({
  id,
  name,
  category,
  description,
  price,
  image,
  stock = 0,
  sellerId,
  sellerBusinessName,
  groupDealEnabled,
  groupPrice,
  groupMinQuantity = 2,
  groupDealNote,
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 3;

  const hasGroupDeal =
    Boolean(groupDealEnabled) &&
    Number(groupPrice || 0) > 0 &&
    Number(groupPrice) < price &&
    groupMinQuantity > 1;

  return (
    <div className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {image && (
        <div className="mb-5">
          <ProductVisual image={image} alt={name} size="medium" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{category}</p>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isOutOfStock
              ? "bg-red-50 text-red-700"
              : isLowStock
                ? "bg-yellow-50 text-yellow-700"
                : "bg-green-50 text-green-700"
          }`}
        >
          {isOutOfStock
            ? "Out of Stock"
            : isLowStock
              ? `Low Stock: ${stock}`
              : `In Stock: ${stock}`}
        </span>
      </div>

      {hasGroupDeal && (
        <div className="mt-3 rounded-xl bg-orange-50 p-3">
          <p className="text-sm font-bold text-orange-800">
            Group Deal: {formatCurrency(Number(groupPrice))}
          </p>

          <p className="mt-1 text-xs text-orange-700">
            Buy {groupMinQuantity}+ item(s) to unlock this price.
          </p>

          {groupDealNote && (
            <p className="mt-1 text-xs text-orange-700">{groupDealNote}</p>
          )}
        </div>
      )}

      <h2 className="mt-3 text-xl font-bold text-gray-900">{name}</h2>

      {sellerBusinessName && sellerId && (
        <Link
          href={`/sellers/${sellerId}`}
          className="mt-1 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Sold by {sellerBusinessName} ✓
        </Link>
      )}

      {sellerBusinessName && !sellerId && (
        <p className="mt-1 text-sm font-medium text-gray-600">
          Sold by {sellerBusinessName}
        </p>
      )}

      {id && <ProductRatingSummary productId={id} />}

      <p className="mt-2 line-clamp-2 text-gray-600">{description}</p>

      <div className="mt-5">
        {hasGroupDeal ? (
          <>
            <p className="text-sm text-gray-500 line-through">
              {formatCurrency(price)}
            </p>

            <p className="text-2xl font-bold text-gray-900">
              From {formatCurrency(Number(groupPrice))}
            </p>
          </>
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(price)}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {id && (
          <Link
            href={`/products/${id}`}
            className="rounded-lg border border-gray-300 px-5 py-2 text-center text-gray-900 hover:bg-gray-50"
          >
            View Details
          </Link>
        )}

        {id && !isOutOfStock && <AddToCartButton productId={id} />}

        {id && hasGroupDeal && !isOutOfStock && (
          <AddGroupDealButton
            productId={id}
            groupMinQuantity={groupMinQuantity}
            stock={stock}
          />
        )}

        {isOutOfStock && (
          <button
            type="button"
            disabled
            className="rounded-lg bg-gray-200 px-5 py-2 text-gray-500"
          >
            Unavailable
          </button>
        )}
      </div>
    </div>
  );
}