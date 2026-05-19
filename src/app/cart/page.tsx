import CartContent from "@/components/CartContent";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-900">Shopping Cart</h1>

        <CartContent />
      </section>
    </main>
  );
}