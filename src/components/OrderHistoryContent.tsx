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
  status: string;
  customer: {
    fullName: string;
    email: string;
    shippingAddress: string;
  };
  items: OrderItem[];
  total: number;
};

export default function OrderHistoryContent() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    const storedOrders: Order[] = savedOrders ? JSON.parse(savedOrders) : [];

    setOrders(storedOrders);
  }, []);

  function handleClearOrders() {
    localStorage.removeItem("orders");
    localStorage.removeItem("lastOrder");
    setOrders([]);
  }

  if (orders.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">No orders found.</p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClearOrders}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Clear Order History
        </button>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Order {order.id}
              </h2>

              <p className="mt-1 text-gray-600">{order.createdAt}</p>
              <p className="mt-1 text-gray-600">
                Customer: {order.customer.fullName}
              </p>
              <p className="mt-1 font-semibold text-gray-900">
  Status: {order.status || "Pending"}
</p>
            </div>

            <p className="text-xl font-bold text-gray-900">
              ${order.total.toFixed(2)}
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                    {item.image}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </div>

                <p className="font-bold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}