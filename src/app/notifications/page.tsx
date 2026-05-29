import NotificationCenterContent from "@/components/NotificationCenterContent";

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Notification Center
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Marketplace Updates
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Track order, payment, delivery, seller, refund, dispute, and payout
            updates from one place.
          </p>
        </div>

        <NotificationCenterContent />
      </section>
    </main>
  );
}