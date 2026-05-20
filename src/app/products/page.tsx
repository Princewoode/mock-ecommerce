import ProductList from "@/components/ProductList";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Product Catalogue
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">Products</h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Browse, search, filter, and sort available products in our store.
          </p>
        </div>

        <ProductList />
      </section>
    </main>
  );
}