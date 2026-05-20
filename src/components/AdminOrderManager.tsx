"use client";

import { useEffect, useState } from "react";

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
  status?: string;
  customer: {
    fullName: string;
    email: string;
    shippingAddress: string;
  };
  items: OrderItem[];
  total: number;
};

const orderStatuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  function loadOrders() {
    const savedOrders = localStorage.getItem("orders");
    const storedOrders: Order[] = savedOrders ? JSON.parse(savedOrders) : [];

    setOrders(storedOrders);
  }

  function saveOrders(updatedOrders: Order[]) {
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);

    if (updatedOrders.length > 0) {
      localStorage.setItem("lastOrder", JSON.stringify(updatedOrders[0]));
    } else {
      localStorage.removeItem("lastOrder");
    }
  }

  function handleStatusChange(orderId: string, newStatus: string) {
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: newStatus,
          }
        : order
    );

    saveOrders(updatedOrders);
  }

  function handleDeleteOrder(orderId: string) {
    const updatedOrders = orders.filter((order) => order.id !== orderId);

    saveOrders(updatedOrders);
  }

  function handleClearOrders() {
    localStorage.removeItem("orders");
    localStorage.removeItem("lastOrder");
    setOrders([]);
  }

  if (orders.length === 0) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Admin Order Management
        </h2>

        <p className="mt-4 text-gray-600">
          No customer orders have been placed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Admin Order Management
          </h2>

          <p className="mt-2 text-gray-600">
            View and update customer order statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearOrders}
          className="rounded-lg border border-red-300 px-5 py-2 text-red-600"
        >
          Clear All Orders
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Order {order.id}
                </h3>

                <p className="mt-1 text-gray-600">{order.createdAt}</p>
                <p className="mt-1 text-gray-600">
                  Customer: {order.customer.fullName}
                </p>
                <p className="mt-1 text-gray-600">
                  Email: {order.customer.email}
                </p>
                <p className="mt-1 text-gray-600">
                  Address: {order.customer.shippingAddress}
                </p>
              </div>

              <div className="min-w-48">
                <label className="block text-sm font-medium text-gray-700">
                  Order Status
                </label>

                <select
                  value={order.status || "Pending"}
                  onChange={(event) =>
                    handleStatusChange(order.id, event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleDeleteOrder(order.id)}
                  className="mt-3 w-full rounded-lg border border-red-300 px-4 py-2 text-red-600"
                >
                  Delete Order
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4 border-t pt-5">
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
                      <p className="font-semibold text-gray-900">
                        {item.name}
                      </p>

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

            <div className="mt-5 flex justify-between border-t pt-5">
              <p className="text-lg font-bold text-gray-900">Total</p>
              <p className="text-lg font-bold text-gray-900">
                ${order.total.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}