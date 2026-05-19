"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
  productId: number;
  name: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
    shippingAddress: string;
  };
  items: OrderItem[];
  total: number;
};

export default function OrderSuccessContent() {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem("lastOrder");

    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    }
  }, []);

  if (!order) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900">No Recent Order</h1>

        <p className="mt-4 text-lg text-gray-600">
          You have not placed an order yet.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Continue Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
      <h1 className="text-4xl font-bold text-gray-900">
        Order Placed Successfully
      </h1>

      <p className="mt-4 text-lg text-gray-600">
        Thank you, {order.customer.fullName}. Your mock order has been saved.
      </p>

      <div className="mx-auto mt-8 max-w-xl rounded-xl border border-gray-200 p-5 text-left">
        <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

        <p className="mt-2 text-sm text-gray-600">Order ID: {order.id}</p>
        <p className="text-sm text-gray-600">Date: {order.createdAt}</p>

        <div className="mt-4 space-y-4 border-t pt-4">
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-3xl">
                  {item.image}
                </div>

                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
              </div>

              <p className="font-bold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-lg font-bold text-gray-900">Total</p>
          <p className="text-lg font-bold text-gray-900">
            ${order.total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <Link
          href="/products"
          className="inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Continue Shopping
        </Link>

        <Link
          href="/orders"
          className="inline-block rounded-lg border border-gray-300 px-6 py-3 text-gray-900"
        >
          View Orders
        </Link>
      </div>
    </section>
  );
}