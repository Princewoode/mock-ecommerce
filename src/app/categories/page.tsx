import CategoryBrowseContent from "@/components/CategoryBrowseContent";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Ghana Marketplace Categories
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Browse by Category
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Discover products from verified Ghana sellers, boutiques,
            wholesalers, importers, and local producers.
          </p>
        </div>

        <CategoryBrowseContent />
      </section>
    </main>
  );
}