import SellerApplyContent from "@/components/SellerApplyContent";

export default function SellerApplyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Become a Seller
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Sell on MockShop Ghana
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Join a Ghana-first ecommerce marketplace built for small sellers,
            boutiques, importers, wholesalers, and local producers. Seller
            applications are reviewed before approval to protect buyer trust.
          </p>
        </div>

        <SellerApplyContent />
      </section>
    </main>
  );
}