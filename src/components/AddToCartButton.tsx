"use client";

import { useRouter } from "next/navigation";
import { addProductToCart } from "@/utils/cartStorage";

type AddToCartButtonProps = {
  productId: number;
};

export default function AddToCartButton({
  productId,
}: AddToCartButtonProps) {
  const router = useRouter();

  function handleAddToCart() {
    const result = addProductToCart(productId);

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="rounded-lg bg-black px-5 py-2 text-white transition hover:bg-gray-800"
    >
      Add to Cart
    </button>
  );
}