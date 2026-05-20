import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function Home() {
  const featuredProduct = products[0];

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-b from-white to-gray-100 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Modern Mock Ecommerce Platform
            </p>

            <h1 className="mt-4 text-5xl font-bold leading-tight text-gray-900">
              Build, browse, cart, checkout, and manage products.
            </h1>

            <p className="mt-6 text-lg text-gray-600">
              MockShop is a learning-focused ecommerce platform with customer
              shopping features and admin management tools.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/products"
                className="rounded-lg bg-black px-6 py-3 text-center text-white"
              >
                Shop Products
              </Link>

              <Link
                href="/admin"
                className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex h-64 items-center justify-center rounded-2xl bg-gray-100 text-8xl">
              🛍️
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-900">3+</p>
                <p className="text-sm text-gray-600">Products</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-900">Cart</p>
                <p className="text-sm text-gray-600">Enabled</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-900">Admin</p>
                <p className="text-sm text-gray-600">Ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Product
            </h2>

            <p className="mt-2 text-gray-600">
              Start with one of our selected products.
            </p>
          </div>

          <Link href="/products" className="font-medium text-gray-900">
            View all products →
          </Link>
        </div>

        <div className="mt-8 max-w-sm">
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