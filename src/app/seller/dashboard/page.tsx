import SellerDashboardContent from "@/components/SellerDashboardContent";
import SellerOrderManager from "@/components/SellerOrderManager";

export default function SellerDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Seller Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Manage Your Store
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Verified sellers can add products, update prices, manage stock, view
            customer orders, and grow their Ghana marketplace presence.
          </p>
        </div>

        <SellerDashboardContent />
        <SellerOrderManager />
      </section>
    </main>
  );
}