import AccountContent from "@/components/AccountContent";

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Customer Area
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">Account</h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Register or login to save your profile and view your own orders.
          </p>
        </div>

        <AccountContent />
      </section>
    </main>
  );
}