import ProtectedAdmin from "@/components/ProtectedAdmin";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-gray-900">
          Admin Product Manager
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Login to add, edit, and delete custom products for your mock store.
        </p>

        <ProtectedAdmin />
      </section>
    </main>
  );
}