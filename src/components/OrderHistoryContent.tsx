"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";
import { Order } from "@/types/models";
import { getCurrentCustomer } from "@/utils/authStorage";
import { getOrdersByCustomerEmail } from "@/utils/orderStorage";
import { getCustomerDatabaseOrders } from "@/utils/databaseOrderService";
import { formatCurrency } from "@/utils/currency";

export default function OrderHistoryContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const customer = getCurrentCustomer();

      if (!customer) {
        setCustomerEmail("");
        setOrders([]);
        setIsLoading(false);
        return;
      }

      setCustomerEmail(customer.email);

      try {
        const databaseOrders = await getCustomerDatabaseOrders({
          email: customer.email,
          customerId: customer.id,
        });

        setOrders(databaseOrders);
        setMessage("");
      } catch {
        const fallbackOrders = getOrdersByCustomerEmail(customer.email);

        setOrders(fallbackOrders);
        setMessage(
          "Could not load database orders. Showing local fallback orders."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  if (!customerEmail) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">
          Please login to view your personal order history.
        </p>

        <Link
          href="/account"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Login or Register
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">No orders found for {customerEmail}.</p>

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
      {message && (
        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Order {order.id}
              </h2>

              <p className="mt-1 text-gray-600">{order.createdAt}</p>

              <p className="mt-1 font-semibold text-gray-900">
                Status: {order.status || "Pending Payment"}
              </p>

              <p className="mt-1 text-gray-600">
                Payment: {order.paymentMethod || "Not specified"}
              </p>

              {order.delivery && (
                <div className="mt-3 rounded-xl bg-gray-50 p-4 text-gray-700">
                  <p className="font-semibold text-gray-900">
                    Delivery Details
                  </p>

                  <p className="mt-1">
                    Location: {order.delivery.city}, {order.delivery.region}
                  </p>

                  <p>Phone: {order.delivery.phone}</p>

                  <p>Delivery Fee: {formatCurrency(order.delivery.fee)}</p>
                </div>
              )}

              {order.fulfillment && (
                <div className="mt-3 rounded-xl bg-gray-50 p-4 text-gray-700">
                  <p className="font-semibold text-gray-900">
                    Fulfilment Updates
                  </p>

                  {order.fulfillment.trackingCode && (
                    <p className="mt-1">
                      Tracking Code: {order.fulfillment.trackingCode}
                    </p>
                  )}

                  {order.fulfillment.courierName && (
                    <p>Courier: {order.fulfillment.courierName}</p>
                  )}

                  {order.fulfillment.courierPhone && (
                    <p>Courier Phone: {order.fulfillment.courierPhone}</p>
                  )}

                  {!order.fulfillment.trackingCode &&
                    !order.fulfillment.courierName &&
                    !order.fulfillment.courierPhone && (
                      <p className="mt-1">
                        Fulfilment details will appear here after dispatch.
                      </p>
                    )}
                </div>
              )}
            </div>

            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(order.total)}
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div
                key={`${order.id}-${item.productId}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <ProductVisual image={item.image} alt={item.name} size="small" />

                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                </div>

                <p className="font-bold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}