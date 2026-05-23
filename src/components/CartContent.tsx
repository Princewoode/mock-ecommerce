"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";
import { CartItem, StoreProduct } from "@/types/models";
import {
  decreaseCartItem,
  getCartItems,
  increaseCartItem,
  removeCartItem,
} from "@/utils/cartStorage";
import { getProductCatalog } from "@/utils/productCatalogService";
import { formatCurrency } from "@/utils/currency";
export default function CartContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<StoreProduct[]>([]);

  useEffect(() => {
    loadCart();

    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("productsUpdated", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("productsUpdated", loadCart);
    };
  }, []);

  async function loadCart() {
    setCartItems(getCartItems());
    setProductCatalog(await getProductCatalog());
  }

  async function handleIncrease(productId: number) {
    const result = await increaseCartItem(productId);

    if (!result.success) {
      alert(result.message);
      return;
    }

    await loadCart();
  }

  async function handleDecrease(productId: number) {
    decreaseCartItem(productId);
    await loadCart();
  }

  async function handleRemove(productId: number) {
    removeCartItem(productId);
    await loadCart();
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
              className="flex flex-col justify-between gap-5 border-b pb-6 md:flex-row md:items-center"
            >
              <div className="flex items-center gap-4">
                <ProductVisual
                  image={product.image}
                  alt={product.name}
                  size="small"
                />

                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {product.name}
                  </h2>

                  <p className="mt-1 text-gray-600">{product.category}</p>

                  <p className="mt-1 text-sm text-gray-500">
                    Available stock: {product.stock}
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDecrease(product.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1"
                    >
                      -
                    </button>

                    <span className="font-semibold">{product.quantity}</span>

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
               {formatCurrency(product.price * product.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xl font-bold text-gray-900">Total</p>

        <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
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