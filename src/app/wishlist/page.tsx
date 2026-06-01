import WishlistContent from "@/components/WishlistContent";

export default function WishlistPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Wishlist
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Saved for Later
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Save products, compare sellers, share with friends on WhatsApp, and
            return when ready to buy.
          </p>
        </div>

        <WishlistContent />
      </section>
    </main>
  );
}