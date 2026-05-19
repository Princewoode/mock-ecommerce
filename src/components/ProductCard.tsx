import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
type ProductCardProps = {
  id?: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
};

export default function ProductCard({
  id,
  name,
  category,
  description,
  price,
  image,
}: ProductCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      {image && (
        <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-gray-100 text-6xl">
          {image}
        </div>
      )}

      <p className="text-sm text-gray-500">{category}</p>

      <h2 className="mt-2 text-xl font-semibold text-gray-900">{name}</h2>

      <p className="mt-2 text-gray-600">{description}</p>

      <p className="mt-4 text-lg font-bold text-gray-900">
        ${price.toFixed(2)}
      </p>

      <div className="mt-4 flex gap-3">
        {id && (
          <Link
            href={`/products/${id}`}
            className="inline-block rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
          >
            View Details
          </Link>
        )}

        {id && <AddToCartButton productId={id} />}
      </div>
    </div>
  );
}