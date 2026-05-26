import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
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
  sellerBusinessName?: string;
};

export default function ProductCard({
  id,
  name,
  category,
  description,
  price,
  image,
  stock = 0,
  sellerBusinessName,
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 3;

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

      <h2 className="mt-2 text-xl font-bold text-gray-900">{name}</h2>

      {sellerBusinessName && (
        <p className="mt-1 text-sm font-medium text-gray-600">
          Sold by {sellerBusinessName}
        </p>
      )}

      {id && <ProductRatingSummary productId={id} />}

      <p className="mt-2 line-clamp-2 text-gray-600">{description}</p>

      <p className="mt-5 text-2xl font-bold text-gray-900">
        {formatCurrency(price)}
      </p>

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