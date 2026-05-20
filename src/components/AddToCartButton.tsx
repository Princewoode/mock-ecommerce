"use client";

import { useRouter } from "next/navigation";

type AddToCartButtonProps = {
  productId: number;
};

type CartItem = {
  productId: number;
  quantity: number;
};

export default function AddToCartButton({
  productId,
}: AddToCartButtonProps) {
  const router = useRouter();

  function handleAddToCart() {
    const savedCart = localStorage.getItem("cartItems");
    const cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    const existingItem = cartItems.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        productId,
        quantity: 1,
      });
    }

    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    localStorage.removeItem("cartProductId");

    window.dispatchEvent(new Event("cartUpdated"));

    router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
className="rounded-lg bg-black px-5 py-2 text-white transition hover:bg-gray-800"    >
      Add to Cart
    </button>
  );
}