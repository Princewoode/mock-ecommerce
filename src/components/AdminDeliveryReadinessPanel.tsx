"use client";

import { useEffect, useMemo, useState } from "react";
import ProductVisual from "@/components/ProductVisual";
import { Order } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import {
  getAdminDatabaseOrders,
  updateDatabaseOrderDetails,
} from "@/utils/databaseOrderService";

type DeliveryDraft = {
  courierName: string;
  courierPhone: string;
  trackingCode: string;
  adminNote: string;
};

function getSellerReadiness(order: Order) {
  const sellerItems = order.items.filter(
    (item) => item.sellerId || item.sellerBusinessName
  );

  const readySellerItems = sellerItems.filter(
    (item) => item.sellerFulfillmentStatus === "Ready for Pickup"
  );

  const pendingSellerItems = sellerItems.filter(
    (item) => item.sellerFulfillmentStatus !== "Ready for Pickup"
  );

  return {
    sellerItemCount: sellerItems.length,
    readySellerItemCount: readySellerItems.length,
    pendingSellerItemCount: pendingSellerItems.length,
    isReadyForCourier:
      sellerItems.length === 0 || pendingSellerItems.length === 0,
  };
}

export default function AdminDeliveryReadinessPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DeliveryDraft>>({});
  const [filter, setFilter] = useState("ready");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setIsLoading(true);
      setMessage("");

      const databaseOrders = await getAdminDatabaseOrders();

      setOrders(databaseOrders);

      const draftData: Record<string, DeliveryDraft> = {};

      databaseOrders.forEach((order) => {
        draftData[order.id] = {
          courierName: order.fulfillment?.courierName || "",
          courierPhone: order.fulfillment?.courierPhone || "",
          trackingCode: order.fulfillment?.trackingCode || "",
          adminNote: order.fulfillment?.adminNote || "",
        };
      });

      setDrafts(draftData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery readiness."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateDraft(orderId: string, field: keyof DeliveryDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value,
      },
    }));
  }

  async function saveDeliveryUpdate(order: Order, nextStatus: string) {
    const draft = drafts[order.id];

    if (!draft) {
      setMessage("No delivery draft found for this order.");
      return;
    }

    if (!draft.courierName.trim() || !draft.courierPhone.trim()) {
      setMessage("Please enter courier/rider name and phone number.");
      return;
    }

    try {
      await updateDatabaseOrderDetails({
        orderId: order.id,
        status: nextStatus,

        courierName: draft.courierName,
        courierPhone: draft.courierPhone,
        trackingCode:
          draft.trackingCode ||
          `GH-DEL-${order.id.slice(0, 8).toUpperCase()}`,
        adminNote: draft.adminNote,

        paymentStatus: order.payment?.status || "Pending",
        paymentPhone: order.payment?.phone || "",
        paymentReference: order.payment?.reference || "",
        paymentNote: order.payment?.note || "",
        escrowStatus: order.payment?.escrowStatus || "Held",

        refundStatus: order.customerAction?.refundStatus || "None",
        refundReason: order.customerAction?.refundReason || "",
        disputeStatus: order.customerAction?.disputeStatus || "None",
        disputeReason: order.customerAction?.disputeReason || "",
      });

      setMessage(`Order ${order.id} updated to ${nextStatus}.`);
      await loadOrders();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update delivery status."
      );
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const readiness = getSellerReadiness(order);

      if (filter === "ready") {
        return readiness.isReadyForCourier && order.status !== "Delivered";
      }

      if (filter === "pending-seller") {
        return !readiness.isReadyForCourier && order.status !== "Delivered";
      }

      if (filter === "out-for-delivery") {
        return order.status === "Out for Delivery";
      }

      if (filter === "delivered") {
        return order.status === "Delivered";
      }

      return true;
    });
  }, [orders, filter]);

  const summary = useMemo(() => {
    return orders.reduce(
      (totals, order) => {
        const readiness = getSellerReadiness(order);

        if (readiness.isReadyForCourier && order.status !== "Delivered") {
          totals.ready += 1;
        }

        if (!readiness.isReadyForCourier && order.status !== "Delivered") {
          totals.pendingSeller += 1;
        }

        if (order.status === "Out for Delivery") {
          totals.outForDelivery += 1;
        }

        if (order.status === "Delivered") {
          totals.delivered += 1;
        }

        return totals;
      },
      {
        ready: 0,
        pendingSeller: 0,
        outForDelivery: 0,
        delivered: 0,
      }
    );
  }, [orders]);

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Delivery Readiness
        </h2>

        <p className="mt-4 text-gray-600">Loading delivery readiness...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Readiness
          </h2>

          <p className="mt-2 text-gray-600">
            Check seller pickup readiness before assigning riders. This helps
            coordinate delivery across Accra, Tema, Kumasi, Takoradi, Tamale,
            Cape Coast, and regional towns.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter("ready")}
          className={`rounded-xl p-4 text-left ${
            filter === "ready" ? "bg-green-50" : "bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-500">Ready for Courier</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summary.ready}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("pending-seller")}
          className={`rounded-xl p-4 text-left ${
            filter === "pending-seller" ? "bg-orange-50" : "bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-500">Pending Seller</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summary.pendingSeller}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("out-for-delivery")}
          className={`rounded-xl p-4 text-left ${
            filter === "out-for-delivery" ? "bg-blue-50" : "bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-500">Out for Delivery</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summary.outForDelivery}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("delivered")}
          className={`rounded-xl p-4 text-left ${
            filter === "delivered" ? "bg-gray-200" : "bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summary.delivered}
          </p>
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="mt-6 text-gray-600">
          No orders found for this delivery filter.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {filteredOrders.map((order) => {
            const readiness = getSellerReadiness(order);
            const draft = drafts[order.id];

            return (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 p-5"
              >
                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="flex flex-col justify-between gap-3 md:flex-row">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Order {order.id}
                        </h3>

                        <p className="mt-1 text-gray-600">{order.createdAt}</p>

                        <p className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                          Order Status: {order.status}
                        </p>
                      </div>

                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>

                    <div
                      className={`mt-4 rounded-xl p-4 ${
                        readiness.isReadyForCourier
                          ? "bg-green-50"
                          : "bg-orange-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">
                        Seller Pickup Readiness
                      </p>

                      <p className="mt-2 text-sm text-gray-700">
                        {readiness.readySellerItemCount} of{" "}
                        {readiness.sellerItemCount} seller item(s) ready.
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {readiness.isReadyForCourier
                          ? "Ready for courier assignment."
                          : `${readiness.pendingSellerItemCount} seller item(s) still pending.`}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Customer Delivery Details
                      </p>

                      <p className="mt-2 text-gray-600">
                        Customer: {order.customer.fullName}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Location: {order.delivery?.city},{" "}
                        {order.delivery?.region}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Phone: {order.delivery?.phone}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Address / Landmark: {order.customer.shippingAddress}
                      </p>
                    </div>
                  </div>

                  {draft && (
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Assign Courier / Rider
                      </p>

                      <p className="mt-2 text-sm text-gray-700">
                        Assign delivery only after seller items are ready, or
                        when this is a platform-managed stock order.
                      </p>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Courier / Rider Name
                          </label>

                          <input
                            value={draft.courierName}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "courierName",
                                event.target.value
                              )
                            }
                            placeholder="Example: Kwame Rider"
                            className="mt-2 w-full rounded-lg border border-blue-200 px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Courier / Rider Phone
                          </label>

                          <input
                            value={draft.courierPhone}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "courierPhone",
                                event.target.value
                              )
                            }
                            placeholder="Example: 0241234567"
                            className="mt-2 w-full rounded-lg border border-blue-200 px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tracking Code
                          </label>

                          <input
                            value={draft.trackingCode}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "trackingCode",
                                event.target.value
                              )
                            }
                            placeholder="Auto-generated if empty"
                            className="mt-2 w-full rounded-lg border border-blue-200 px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Admin Delivery Note
                          </label>

                          <textarea
                            value={draft.adminNote}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "adminNote",
                                event.target.value
                              )
                            }
                            placeholder="Example: Rider should pick up from Madina seller before delivery to customer."
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-blue-200 px-4 py-3"
                          />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              saveDeliveryUpdate(order, "Out for Delivery")
                            }
                            disabled={!readiness.isReadyForCourier}
                            className="rounded-lg bg-black px-5 py-2 text-white disabled:bg-gray-300 disabled:text-gray-500"
                          >
                            Mark Out for Delivery
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              saveDeliveryUpdate(order, "Delivered")
                            }
                            className="rounded-lg border border-green-300 px-5 py-2 text-green-700"
                          >
                            Mark Delivered
                          </button>
                        </div>

                        {!readiness.isReadyForCourier && (
                          <p className="text-sm text-orange-700">
                            Courier assignment is disabled until all seller
                            items are ready for pickup.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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

                            {item.sellerBusinessName && (
                              <p className="text-sm text-gray-500">
                                Seller: {item.sellerBusinessName}
                              </p>
                            )}

                            {item.sellerBusinessName && (
                              <div
                                className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                                  item.sellerFulfillmentStatus ===
                                  "Ready for Pickup"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-orange-50 text-orange-700"
                                }`}
                              >
                                <p className="font-semibold">
                                  Seller Fulfilment:{" "}
                                  {item.sellerFulfillmentStatus ||
                                    "Pending Seller Action"}
                                </p>

                                {item.sellerReadyAt && (
                                  <p className="mt-1">
                                    Ready At: {item.sellerReadyAt}
                                  </p>
                                )}

                                {item.sellerFulfillmentNote && (
                                  <p className="mt-1">
                                    Seller Note:{" "}
                                    {item.sellerFulfillmentNote}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="font-bold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}