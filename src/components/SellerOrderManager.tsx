"use client";

import { useEffect, useState } from "react";
import ProductVisual from "@/components/ProductVisual";
import { Order } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { getSellerOrders } from "@/utils/sellerOrderService";

export default function SellerOrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setIsLoading(true);
      setMessage("");

      const sellerOrders = await getSellerOrders();

      setOrders(sellerOrders);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load seller orders."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Seller Orders</h2>
        <p className="mt-4 text-gray-600">Loading orders for your products...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seller Orders</h2>

          <p className="mt-2 text-gray-600">
            View orders that contain your own marketplace products only.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Orders
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      {orders.length === 0 ? (
        <p className="mt-6 text-gray-600">
          No orders have been placed for your products yet.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-gray-200 p-5"
            >
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Order {order.id}
                  </h3>

                  <p className="mt-1 text-gray-600">{order.createdAt}</p>

                  <p className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    Status: {order.status}
                  </p>

                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <p className="font-semibold text-gray-900">
                      Customer Details
                    </p>

                    <p className="mt-2 text-gray-600">
                      Name: {order.customer.fullName}
                    </p>

                    <p className="mt-1 text-gray-600">
                      Email: {order.customer.email}
                    </p>

                    <p className="mt-1 text-gray-600">
                      Address / Landmark: {order.customer.shippingAddress}
                    </p>

                    <p className="mt-1 text-gray-600">
                      Payment: {order.paymentMethod || "Not specified"}
                    </p>
                  </div>

                  {order.delivery && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Delivery Details
                      </p>

                      <p className="mt-2 text-gray-600">
                        Location: {order.delivery.city},{" "}
                        {order.delivery.region}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Delivery Phone: {order.delivery.phone}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Delivery Fee: {formatCurrency(order.delivery.fee)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">
                    Fulfilment Updates
                  </p>

                  <p className="mt-2 text-gray-600">
                    Tracking Code:{" "}
                    {order.fulfillment?.trackingCode || "Not assigned yet"}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Courier: {order.fulfillment?.courierName || "Not assigned"}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Courier Phone:{" "}
                    {order.fulfillment?.courierPhone || "Not assigned"}
                  </p>

                  <p className="mt-4 text-sm text-gray-500">
                    Admin controls official order status and courier assignment
                    in this phase.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 border-t pt-5">
                {order.items.map((item) => (
                  <div
                    key={`${order.id}-${item.productId}`}
                    className="flex items-center justify-between gap-4"
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
                <p className="text-lg font-bold text-gray-900">
                  Seller Subtotal
                </p>

                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}