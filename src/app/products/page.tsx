import ProductList from "@/components/ProductList";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-900">Products</h1>

        <p className="mt-4 text-lg text-gray-600">
          Browse, search, filter, and sort available products in our store.
        </p>

        <ProductList />
      </section>
    </main>
  );
}