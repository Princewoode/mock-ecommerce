"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductVisual from "@/components/ProductVisual";
import { CartItem, Order, StoreProduct } from "@/types/models";
import { getCurrentCustomer } from "@/utils/authStorage";
import { clearCart, getCartItems } from "@/utils/cartStorage";
import { addOrder } from "@/utils/orderStorage";
import { getProductCatalog } from "@/utils/productCatalogService";
import { reduceStockAfterOrder } from "@/utils/productStorage";
import { createDatabaseOrder } from "@/utils/supabaseOrderService";

export default function CheckoutContent() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<StoreProduct[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [formError, setFormError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    async function loadCheckoutData() {
      setCartItems(getCartItems());
      setProductCatalog(await getProductCatalog());

      const customer = getCurrentCustomer();

      if (customer) {
        setFullName(customer.fullName);
        setEmail(customer.email);
        setShippingAddress(customer.shippingAddress);
      }
    }

    loadCheckoutData();
  }, []);

  const checkoutProducts = cartItems.flatMap((cartItem) => {
    const product = productCatalog.find((item) => item.id === cartItem.productId);

    if (!product) {
      return [];
    }

    return [
      {
        ...product,
        quantity: cartItem.quantity,
      },
    ];
  });

  const total = checkoutProducts.reduce((sum, product) => {
    return sum + product.price * product.quantity;
  }, 0);

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !shippingAddress.trim()) {
      setFormError("Please fill in all checkout fields.");
      return;
    }

    if (checkoutProducts.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    const unavailableProduct = checkoutProducts.find(
      (product) => product.quantity > product.stock
    );

    if (unavailableProduct) {
      setFormError(
        `${unavailableProduct.name} only has ${unavailableProduct.stock} item(s) left in stock.`
      );
      return;
    }

    const currentCustomer = getCurrentCustomer();

const order: Order = {
  id: `MS-${Date.now()}`,
  customerId: currentCustomer?.id,
  createdAt: new Date().toLocaleString(),
  status: "Pending",
  paymentMethod,
  customer: {
    fullName,
    email,
    shippingAddress,
  },
      items: checkoutProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        price: product.price,
        quantity: product.quantity,
      })),
      total,
    };

    const stockItems: CartItem[] = checkoutProducts.map((product) => ({
      productId: product.id,
      quantity: product.quantity,
    }));

    try {
      setIsPlacingOrder(true);
      setFormError("");

      const savedOrder = await createDatabaseOrder(order);

      addOrder(savedOrder);
      reduceStockAfterOrder(stockItems);
      clearCart();

      router.push("/order-success");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save order to database."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (checkoutProducts.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">
          Your cart is empty. Please add a product before checkout.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Go to Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>

        <div className="mt-4 space-y-4 border-t pt-4">
          {checkoutProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <ProductVisual
                  image={product.image}
                  alt={product.name}
                  size="small"
                />

                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-gray-600">Quantity: {product.quantity}</p>
                  <p className="text-sm text-gray-500">
                    Available stock: {product.stock}
                  </p>
                </div>
              </div>

              <p className="font-bold text-gray-900">
                ${(product.price * product.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-lg font-bold text-gray-900">Total</p>
          <p className="text-lg font-bold text-gray-900">
            ${total.toFixed(2)}
          </p>
        </div>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm"
      >
        {formError && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Shipping Address
          </label>

          <textarea
            placeholder="Enter your shipping address"
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>

          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="Card Payment">Card Payment</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>

          <p className="mt-2 text-sm text-gray-500">
            This is a mock payment method. No real payment will be processed.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPlacingOrder}
          className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
        >
          {isPlacingOrder ? "Placing Order..." : "Place Mock Order"}
        </button>
      </form>
    </>
  );
}