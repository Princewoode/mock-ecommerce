import RecentlyViewedProducts from "@/components/RecentlyViewedProducts";

export default function RecentlyViewedPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Recently Viewed
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Continue Browsing
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Return to products you viewed earlier, compare prices, save items,
            share with friends on WhatsApp, or complete checkout later.
          </p>
        </div>

        <RecentlyViewedProducts limit={20} />
      </section>
    </main>
  );
}