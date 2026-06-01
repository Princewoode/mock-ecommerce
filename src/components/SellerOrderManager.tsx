"use client";

import { useEffect, useMemo, useState } from "react";
import ProductVisual from "@/components/ProductVisual";
import { Order } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import {
  getSellerOrders,
  markSellerOrderReady,
} from "@/utils/sellerOrderService";

export default function SellerOrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
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

  function updateNote(orderId: string, value: string) {
    setNotes((current) => ({
      ...current,
      [orderId]: value,
    }));
  }

  async function handleMarkReady(orderId: string) {
    try {
      const result = await markSellerOrderReady({
        orderId,
        note: notes[orderId] || "",
      });

      setMessage(result.message);
      updateNote(orderId, "");
      await loadOrders();
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to mark order as ready."
      );
    }
  }

  const payoutSummary = useMemo(() => {
    return orders.reduce(
      (summary, order) => {
        order.items.forEach((item) => {
          const gross = item.price * item.quantity;

          summary.grossSales += gross;
          summary.platformCommission += item.platformCommissionAmount || 0;
          summary.sellerPayout += item.sellerPayoutAmount || gross;
        });

        return summary;
      },
      {
        grossSales: 0,
        platformCommission: 0,
        sellerPayout: 0,
      }
    );
  }, [orders]);

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Seller Orders</h2>
        <p className="mt-4 text-gray-600">Loading seller orders...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seller Orders</h2>

          <p className="mt-2 text-gray-600">
            View orders containing your products, monitor payment and escrow,
            and tell admin when your items are ready for pickup.
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
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Gross Seller Sales</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(payoutSummary.grossSales)}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Platform Commission</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(payoutSummary.platformCommission)}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Estimated Seller Payout</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(payoutSummary.sellerPayout)}
            </p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="mt-6 text-gray-600">
          No orders have been placed for your products yet.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {orders.map((order) => {
            const allItemsReady = order.items.every(
              (item) => item.sellerFulfillmentStatus === "Ready for Pickup"
            );

            return (
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
                      Order Status: {order.status}
                    </p>

                    <div className="mt-4 rounded-xl bg-yellow-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Payment and Escrow
                      </p>

                      <p className="mt-2 text-gray-700">
                        Payment Method: {order.paymentMethod || "Not specified"}
                      </p>

                      <p className="mt-1 text-gray-700">
                        Payment Status: {order.payment?.status || "Pending"}
                      </p>

                      <p className="mt-1 text-gray-700">
                        Escrow Status: {order.payment?.escrowStatus || "Held"}
                      </p>

                      {order.payment?.reference && (
                        <p className="mt-1 text-gray-700">
                          Reference: {order.payment.reference}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Delivery Details
                      </p>

                      <p className="mt-2 text-gray-600">
                        Location: {order.delivery?.city},{" "}
                        {order.delivery?.region}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Delivery Phone: {order.delivery?.phone}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Delivery Fee:{" "}
                        {formatCurrency(order.delivery?.fee || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-orange-50 p-4">
                    <p className="font-semibold text-gray-900">
                      Seller Fulfilment Action
                    </p>

                    <p className="mt-2 text-sm text-gray-700">
                      Mark your items as ready after you have packed/prepared
                      the products. Admin will receive a notification and can
                      coordinate rider pickup or delivery.
                    </p>

                    <textarea
                      value={notes[order.id] || ""}
                      onChange={(event) =>
                        updateNote(order.id, event.target.value)
                      }
                      placeholder="Optional note for admin, e.g. ready at Makola shop after 2pm."
                      rows={4}
                      className="mt-4 w-full rounded-lg border border-orange-200 px-4 py-3"
                    />

                    <button
                      type="button"
                      onClick={() => handleMarkReady(order.id)}
                      disabled={allItemsReady}
                      className="mt-4 rounded-lg bg-orange-600 px-5 py-2 text-white disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      {allItemsReady
                        ? "Already Ready for Pickup"
                        : "Mark Items Ready"}
                    </button>

                    {order.fulfillment?.trackingCode && (
                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="font-semibold text-gray-900">
                          Admin Delivery Update
                        </p>

                        <p className="mt-2 text-gray-600">
                          Tracking Code: {order.fulfillment.trackingCode}
                        </p>

                        <p className="mt-1 text-gray-600">
                          Courier:{" "}
                          {order.fulfillment.courierName || "Not assigned"}
                        </p>

                        <p className="mt-1 text-gray-600">
                          Courier Phone:{" "}
                          {order.fulfillment.courierPhone || "Not assigned"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-4 border-t pt-5">
                  {order.items.map((item) => (
                    <div
                      key={`${order.id}-${item.productId}`}
                      className="rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
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

                            <p className="mt-1 text-sm font-semibold text-orange-700">
                              Seller Fulfilment:{" "}
                              {item.sellerFulfillmentStatus ||
                                "Pending Seller Action"}
                            </p>

                            {item.sellerReadyAt && (
                              <p className="mt-1 text-sm text-gray-500">
                                Ready At: {item.sellerReadyAt}
                              </p>
                            )}

                            {item.sellerFulfillmentNote && (
                              <p className="mt-1 text-sm text-gray-500">
                                Note: {item.sellerFulfillmentNote}
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="font-bold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <p className="text-gray-600">
                          Commission Rate: {item.platformCommissionRate || 0}%
                        </p>

                        <p className="text-gray-600">
                          Platform Commission:{" "}
                          {formatCurrency(item.platformCommissionAmount || 0)}
                        </p>

                        <p className="font-semibold text-gray-900">
                          Seller Payout:{" "}
                          {formatCurrency(
                            item.sellerPayoutAmount ||
                              item.price * item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-between border-t pt-5">
                  <p className="text-lg font-bold text-gray-900">
                    Seller Order Gross
                  </p>

                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}