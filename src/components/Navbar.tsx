"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = {
  productId: number;
  quantity: number;
};

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: `Cart (${cartCount})` },
    { href: "/checkout", label: "Checkout" },
    { href: "/orders", label: "Orders" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            MockShop
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 md:hidden"
          >
            Menu
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {menuOpen && (
          <div className="mt-4 grid gap-3 border-t pt-4 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}