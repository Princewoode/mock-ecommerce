"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllProducts, StoreProduct } from "@/utils/productStorage";

type CartItem = {
  productId: number;
  quantity: number;
};

export default function CartContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [productCatalog, setProductCatalog] = useState<StoreProduct[]>([]);
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    const items: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    setCartItems(items);
    setProductCatalog(getAllProducts());
  }, []);

  function updateCart(items: CartItem[]) {
    setCartItems(items);
    localStorage.setItem("cartItems", JSON.stringify(items));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function handleIncrease(productId: number) {
    const updatedItems = cartItems.map((item) =>
      item.productId === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );

    updateCart(updatedItems);
  }

  function handleDecrease(productId: number) {
    const updatedItems = cartItems
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);

    updateCart(updatedItems);
  }

  function handleRemove(productId: number) {
    const updatedItems = cartItems.filter(
      (item) => item.productId !== productId
    );

    updateCart(updatedItems);
  }

  const cartProducts = cartItems
    .map((cartItem) => {
      const product = productCatalog.find(
  (item) => item.id === cartItem.productId
);

      if (!product) {
        return null;
      }

      return {
        ...product,
        quantity: cartItem.quantity,
      };
    })
    .filter(Boolean);

  const total = cartProducts.reduce((sum, product) => {
    if (!product) {
      return sum;
    }

    return sum + product.price * product.quantity;
  }, 0);

  if (cartProducts.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Your cart is currently empty.</p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="space-y-6">
        {cartProducts.map((product) => {
          if (!product) {
            return null;
          }

          return (
            <div
              key={product.id}
              className="flex items-center justify-between border-b pb-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-4xl">
                  {product.image}
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {product.name}
                  </h2>

                  <p className="mt-1 text-gray-600">{product.category}</p>

                  <p className="mt-1 font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDecrease(product.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1"
                    >
                      -
                    </button>

                    <span className="font-semibold">
                      {product.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleIncrease(product.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      className="ml-4 text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-lg font-bold text-gray-900">
                ${(product.price * product.quantity).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xl font-bold text-gray-900">Total</p>

        <p className="text-xl font-bold text-gray-900">
          ${total.toFixed(2)}
        </p>
      </div>

      <Link
        href="/checkout"
        className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}