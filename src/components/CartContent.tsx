"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";
import { CartItem, StoreProduct } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import {
  clearCart,
  getCartItems,
  removeCartItem,
  saveCartItems,
} from "@/utils/cartStorage";
import { getProductCatalog } from "@/utils/productCatalogService";
import {
  getEffectiveProductPrice,
  hasValidGroupDeal,
} from "@/utils/productPricing";

export default function CartContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCartData() {
      setIsLoading(true);
      setCartItems(getCartItems());
      setProductCatalog(await getProductCatalog());
      setIsLoading(false);
    }

    loadCartData();

    window.addEventListener("cartUpdated", loadCartData);
    window.addEventListener("productsUpdated", loadCartData);

    return () => {
      window.removeEventListener("cartUpdated", loadCartData);
      window.removeEventListener("productsUpdated", loadCartData);
    };
  }, []);

  const cartProducts = useMemo(() => {
    return cartItems.flatMap((cartItem) => {
      const product = productCatalog.find(
        (item) => item.id === cartItem.productId
      );

      if (!product) {
        return [];
      }

      const pricing = getEffectiveProductPrice({
        product,
        quantity: cartItem.quantity,
      });

      return [
        {
          ...product,
          quantity: cartItem.quantity,
          effectivePrice: pricing.unitPrice,
          groupDealApplies: pricing.groupDealApplies,
        },
      ];
    });
  }, [cartItems, productCatalog]);

  const subtotal = cartProducts.reduce((sum, product) => {
    return sum + product.effectivePrice * product.quantity;
  }, 0);

  const normalSubtotal = cartProducts.reduce((sum, product) => {
    return sum + product.price * product.quantity;
  }, 0);

  const totalSavings = normalSubtotal - subtotal;

  function refreshCart() {
    setCartItems(getCartItems());
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function handleQuantityChange(productId: number, quantity: number) {
    if (quantity < 1) {
      removeCartItem(productId);
      refreshCart();
      return;
    }

    const product = productCatalog.find((item) => item.id === productId);

    if (product && quantity > product.stock) {
      return;
    }

    const updatedItems = getCartItems().map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity,
          }
        : item
    );

    saveCartItems(updatedItems);
    refreshCart();
  }

  function handleRemove(productId: number) {
    removeCartItem(productId);
    refreshCart();
  }

  function handleClearCart() {
    clearCart();
    refreshCart();
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading cart...</p>
      </div>
    );
  }

  if (cartProducts.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Your cart is empty.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded-lg bg-black px-6 py-3 text-center text-white"
          >
            Continue Shopping
          </Link>

          <Link
            href="/deals"
            className="rounded-lg border border-orange-300 px-6 py-3 text-center text-orange-700"
          >
            Browse Group Deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>

            <p className="mt-2 text-gray-600">
              Review your products, adjust quantities, and unlock group/bulk
              deal prices where available.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCart}
            className="rounded-lg border border-red-300 px-5 py-2 text-red-600"
          >
            Clear Cart
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {cartProducts.map((product) => {
            const hasGroupDeal = hasValidGroupDeal(product);
            const quantityNeeded = Math.max(
              Number(product.groupMinQuantity || 2) - product.quantity,
              0
            );

            return (
              <div
                key={product.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <ProductVisual
                    image={product.image}
                    alt={product.name}
                    size="small"
                  />

                  <div>
                    <p className="font-semibold text-gray-900">
                      {product.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {product.category}
                    </p>

                    {product.sellerBusinessName && (
                      <p className="mt-1 text-sm text-gray-600">
                        Seller: {product.sellerBusinessName}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-gray-500">
                      Available stock: {product.stock}
                    </p>

                    {hasGroupDeal && product.groupDealApplies && (
                      <div className="mt-3 rounded-xl bg-orange-50 p-3">
                        <p className="text-sm font-bold text-orange-800">
                          Group deal unlocked
                        </p>

                        <p className="mt-1 text-sm text-orange-700">
                          You are paying {formatCurrency(product.effectivePrice)}{" "}
                          per item instead of {formatCurrency(product.price)}.
                        </p>
                      </div>
                    )}

                    {hasGroupDeal && !product.groupDealApplies && (
                      <div className="mt-3 rounded-xl bg-yellow-50 p-3">
                        <p className="text-sm font-bold text-yellow-800">
                          Group deal available
                        </p>

                        <p className="mt-1 text-sm text-yellow-700">
                          Add {quantityNeeded} more item
                          {quantityNeeded === 1 ? "" : "s"} to unlock{" "}
                          {formatCurrency(Number(product.groupPrice))} per item.
                        </p>

                        {product.groupDealNote && (
                          <p className="mt-1 text-xs text-yellow-700">
                            {product.groupDealNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    {product.groupDealApplies ? (
                      <>
                        <p className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.price)}
                        </p>

                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(product.effectivePrice)}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(product.id, product.quantity - 1)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-1"
                      >
                        -
                      </button>

                      <span className="min-w-10 text-center font-semibold">
                        {product.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(product.id, product.quantity + 1)
                        }
                        disabled={product.quantity >= product.stock}
                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        +
                      </button>
                    </div>

                    <p className="mt-3 font-bold text-gray-900">
                      {formatCurrency(product.effectivePrice * product.quantity)}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      className="mt-3 text-sm font-medium text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Cart Summary</h2>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Normal subtotal</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(normalSubtotal)}
            </p>
          </div>

          {totalSavings > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
              <p className="font-semibold text-orange-800">
                Group deal savings
              </p>

              <p className="font-bold text-orange-800">
                -{formatCurrency(totalSavings)}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-lg font-bold text-gray-900">Subtotal</p>

            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(subtotal)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
          >
            Continue Shopping
          </Link>

          <Link
            href="/deals"
            className="rounded-lg border border-orange-300 px-6 py-3 text-center text-orange-700"
          >
            Browse Deals
          </Link>

          <Link
            href="/checkout"
            className="rounded-lg bg-black px-6 py-3 text-center text-white"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </>
  );
}