import GroupDealsContent from "@/components/GroupDealsContent";

export default function DealsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Group Deals
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Buy More, Pay Less
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Find discounted bulk and group-buying deals from verified Ghana
            sellers. Ideal for friends, families, resellers, traders, and
            wholesale-style buyers.
          </p>
        </div>

        <GroupDealsContent />
      </section>
    </main>
  );
}