"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";
import { Order } from "@/types/models";
import { getCurrentCustomer } from "@/utils/authStorage";
import { getOrdersByCustomerEmail } from "@/utils/orderStorage";
import { getCustomerDatabaseOrders } from "@/utils/databaseOrderService";
import { formatCurrency } from "@/utils/currency";
import {
  confirmCustomerDelivery,
  openCustomerDispute,
  requestCustomerRefund,
} from "@/utils/customerOrderActionService";

export default function OrderHistoryContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionReasons, setActionReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOrders();
  }, []);

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
      setIsLoading(true);

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

  function updateReason(orderId: string, value: string) {
    setActionReasons((current) => ({
      ...current,
      [orderId]: value,
    }));
  }

  async function handleConfirmDelivery(orderId: string) {
    try {
      const result = await confirmCustomerDelivery(orderId);

      setMessage(result.message);
      await loadOrders();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Delivery confirmation failed."
      );
    }
  }

  async function handleRefundRequest(orderId: string) {
    try {
      const result = await requestCustomerRefund({
        orderId,
        reason: actionReasons[orderId] || "",
      });

      setMessage(result.message);
      updateReason(orderId, "");
      await loadOrders();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Refund request failed."
      );
    }
  }

  async function handleDisputeRequest(orderId: string) {
    try {
      const result = await openCustomerDispute({
        orderId,
        reason: actionReasons[orderId] || "",
      });

      setMessage(result.message);
      updateReason(orderId, "");
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dispute failed.");
    }
  }

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

      {orders.map((order) => {
        const canConfirmDelivery =
          order.status === "Delivered" &&
          !order.customerAction?.deliveryConfirmedAt;

        const hasRefundRequest =
          order.customerAction?.refundStatus &&
          order.customerAction.refundStatus !== "None";

        const hasDispute =
          order.customerAction?.disputeStatus &&
          order.customerAction.disputeStatus !== "None";

        return (
          <div key={order.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Order {order.id}
                </h2>

                <p className="mt-1 text-gray-600">{order.createdAt}</p>

                <p className="mt-1 font-semibold text-gray-900">
                  Order Status: {order.status || "Pending Payment"}
                </p>

                <p className="mt-1 text-gray-600">
                  Payment Method: {order.paymentMethod || "Not specified"}
                </p>

                {order.payment && (
                  <div className="mt-3 rounded-xl bg-yellow-50 p-4 text-gray-700">
                    <p className="font-semibold text-gray-900">
                      Payment and Escrow
                    </p>

                    <p className="mt-1">
                      Payment Status: {order.payment.status || "Pending"}
                    </p>

                    <p>
                      Escrow Status: {order.payment.escrowStatus || "Held"}
                    </p>

                    {order.payment.reference && (
                      <p>Reference: {order.payment.reference}</p>
                    )}

                    {order.payment.confirmedAt && (
                      <p>Confirmed At: {order.payment.confirmedAt}</p>
                    )}

                    {order.payment.note && <p>Note: {order.payment.note}</p>}
                  </div>
                )}

                {order.customerAction && (
                  <div className="mt-3 rounded-xl bg-blue-50 p-4 text-gray-700">
                    <p className="font-semibold text-gray-900">
                      Buyer Protection
                    </p>

                    {order.customerAction.deliveryConfirmedAt ? (
                      <p className="mt-1">
                        Delivery Confirmed At:{" "}
                        {order.customerAction.deliveryConfirmedAt}
                      </p>
                    ) : (
                      <p className="mt-1">Delivery confirmation pending.</p>
                    )}

                    {hasRefundRequest && (
                      <>
                        <p className="mt-1">
                          Refund Status:{" "}
                          {order.customerAction.refundStatus || "None"}
                        </p>
                        {order.customerAction.refundReason && (
                          <p>Refund Reason: {order.customerAction.refundReason}</p>
                        )}
                      </>
                    )}

                    {hasDispute && (
                      <>
                        <p className="mt-1">
                          Dispute Status:{" "}
                          {order.customerAction.disputeStatus || "None"}
                        </p>
                        {order.customerAction.disputeReason && (
                          <p>
                            Dispute Reason:{" "}
                            {order.customerAction.disputeReason}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

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

                      <p className="text-gray-600">Quantity: {item.quantity}</p>

                      {item.sellerBusinessName && (
                        <p className="text-sm text-gray-500">
                          Seller: {item.sellerBusinessName}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Customer Order Actions
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Use these actions only after delivery or when there is a genuine
                issue with the order.
              </p>

              <div className="mt-4">
                <textarea
                  value={actionReasons[order.id] || ""}
                  onChange={(event) =>
                    updateReason(order.id, event.target.value)
                  }
                  placeholder="For refund or dispute, explain the problem clearly."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleConfirmDelivery(order.id)}
                  disabled={!canConfirmDelivery}
                  className="rounded-lg bg-black px-5 py-2 text-white disabled:bg-gray-400"
                >
                  Confirm Delivery
                  <Link
  href={`/orders/${order.id}/tracking`}
  className="rounded-lg border border-blue-300 px-4 py-2 text-center text-sm font-semibold text-blue-700"
>
  Track Delivery
</Link>
                </button>

                <button
                  type="button"
                  onClick={() => handleRefundRequest(order.id)}
                  disabled={Boolean(hasRefundRequest)}
                  className="rounded-lg border border-orange-300 px-5 py-2 text-orange-700 disabled:text-gray-400"
                >
                  Request Refund
                  <Link
  href={`/orders/${order.id}/tracking`}
  className="rounded-lg border border-blue-300 px-4 py-2 text-center text-sm font-semibold text-blue-700"
>
  Track Delivery
</Link>
                </button>

                <button
                  type="button"
                  onClick={() => handleDisputeRequest(order.id)}
                  disabled={Boolean(hasDispute)}
                  className="rounded-lg border border-red-300 px-5 py-2 text-red-600 disabled:text-gray-400"
                >
                  Open Dispute
                  <Link
  href={`/orders/${order.id}/tracking`}
  className="rounded-lg border border-blue-300 px-4 py-2 text-center text-sm font-semibold text-blue-700"
>
  Track Delivery
</Link>
                </button>
              </div>

              {!canConfirmDelivery && !order.customerAction?.deliveryConfirmedAt && (
                <p className="mt-2 text-sm text-gray-500">
                  Delivery can be confirmed only after admin marks the order as
                  Delivered.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}