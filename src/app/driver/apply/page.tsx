import DriverApplyContent from "@/components/DriverApplyContent";

export default function DriverApplyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Delivery Driver Application
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Ride or Deliver for Ghana Marketplace
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Apply as an intra-city rider, inter-city courier, final-mile driver,
            or route-based delivery partner. Verified drivers help move
            packages from sellers to customers across Ghana.
          </p>
        </div>

        <DriverApplyContent />
      </section>
    </main>
  );
}