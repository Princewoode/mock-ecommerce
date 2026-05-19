"use client";

import { useRouter } from "next/navigation";

export default function PlaceOrderButton() {
  const router = useRouter();

  function handlePlaceOrder() {
    const savedCart = localStorage.getItem("cartItems");

    if (!savedCart) {
      return;
    }

    localStorage.setItem("lastOrderItems", savedCart);
    localStorage.removeItem("cartItems");
    localStorage.removeItem("cartProductId");

    window.dispatchEvent(new Event("cartUpdated"));

    router.push("/order-success");
  }

  return (
    <button
      type="button"
      onClick={handlePlaceOrder}
      className="inline-block rounded-lg bg-black px-6 py-3 text-white"
    >
      Place Mock Order
    </button>
  );
}