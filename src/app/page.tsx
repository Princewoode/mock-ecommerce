import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function Home() {
  const featuredProduct = products[0];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl rounded-2xl bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to StudyTech
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          A simple online ecommerce platform.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Shop Now
        </Link>
      </section>

      <section className="mx-auto mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold text-gray-900">Featured Product</h2>

        <div className="mt-6 max-w-sm">
          <ProductCard
           id={featuredProduct.id}
            name={featuredProduct.name}
            category={featuredProduct.category}
            description={featuredProduct.description}
            price={featuredProduct.price}
            image={featuredProduct.image}
          />
        </div>
      </section>
    </main>
  );
}