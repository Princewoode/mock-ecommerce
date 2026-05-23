"use client";

import { useEffect, useState } from "react";
import ProductVisual from "@/components/ProductVisual";
import { Order } from "@/types/models";
import {
  deleteDatabaseOrder,
  getAdminDatabaseOrders,
  updateDatabaseOrderStatus,
} from "@/utils/databaseOrderService";
import { formatCurrency } from "@/utils/currency";
const orderStatuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setIsLoading(true);
      const databaseOrders = await getAdminDatabaseOrders();
      setOrders(databaseOrders);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load database orders."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      await updateDatabaseOrderStatus(orderId, newStatus);
      setMessage("Order status updated successfully.");
      await loadOrders();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update order status."
      );
    }
  }

  async function handleDeleteOrder(orderId: string) {
    try {
      await deleteDatabaseOrder(orderId);
      setMessage("Order deleted successfully.");
      await loadOrders();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete order."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Admin Order Management
        </h2>

        <p className="mt-4 text-gray-600">Loading database orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Admin Order Management
        </h2>

        {message && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-gray-700">
            {message}
          </div>
        )}

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
            View and update Supabase customer order statuses.
          </p>
        </div>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

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

                <p className="mt-1 text-gray-600">
                  Payment: {order.paymentMethod || "Not specified"}
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
                  key={`${order.id}-${item.productId}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <ProductVisual
                      image={item.image}
                      alt={item.name}
                      size="small"
                    />

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
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between border-t pt-5">
              <p className="text-lg font-bold text-gray-900">Total</p>

              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}