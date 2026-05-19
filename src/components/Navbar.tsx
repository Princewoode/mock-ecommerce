"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = {
  productId: number;
  quantity: number;
};

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function updateCartCount() {
      const savedCart = localStorage.getItem("cartItems");
      const cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

      const totalItems = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );

      setCartCount(totalItems);
    }

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          MockShop
        </Link>

        <div className="flex gap-6">
          <Link href="/" className="text-gray-700 hover:text-black">
            Home
          </Link>

          <Link href="/products" className="text-gray-700 hover:text-black">
            Products
          </Link>

          <Link href="/cart" className="text-gray-700 hover:text-black">
            Cart ({cartCount})
          </Link>

          <Link href="/checkout" className="text-gray-700 hover:text-black">
            Checkout
          </Link>
          <Link href="/orders" className="text-gray-700 hover:text-black">
  Orders
</Link>
<Link href="/admin" className="text-gray-700 hover:text-black">
  Admin
</Link>
        </div>
      </nav>
    </header>
  );
}