import CheckoutContent from "@/components/CheckoutContent";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>

        <p className="mt-4 text-lg text-gray-600">
          Complete your mock order below. No real payment will be processed.
        </p>

        <CheckoutContent />
      </section>
    </main>
  );
}