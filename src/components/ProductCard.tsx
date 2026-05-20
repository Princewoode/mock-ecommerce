import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import ProductVisual from "@/components/ProductVisual";
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
    <div className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {image && (
  <div className="mb-5">
    <ProductVisual image={image} alt={name} size="medium" />
  </div>
)}

      <p className="text-sm font-medium text-gray-500">{category}</p>

      <h2 className="mt-2 text-xl font-bold text-gray-900">{name}</h2>

      <p className="mt-2 line-clamp-2 text-gray-600">{description}</p>

      <p className="mt-5 text-2xl font-bold text-gray-900">
        ${price.toFixed(2)}
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

        {id && <AddToCartButton productId={id} />}
      </div>
    </div>
  );
}