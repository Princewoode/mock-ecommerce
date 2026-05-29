"use client";

import { useEffect, useState } from "react";
import ProductVisual from "@/components/ProductVisual";
import { Order } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { orderStatuses } from "@/utils/orderStatus";
import {
  deleteDatabaseOrder,
  getAdminDatabaseOrders,
  updateDatabaseOrderDetails,
} from "@/utils/databaseOrderService";

const paymentStatuses = [
  "Pending",
  "Submitted",
  "Confirmed",
  "Failed",
  "Pay on Delivery",
  "Refunded",
];

const escrowStatuses = ["Held", "Released", "Refunded", "Disputed"];

const refundStatuses = ["None", "Requested", "Approved", "Rejected", "Completed"];

const disputeStatuses = ["None", "Open", "Under Review", "Resolved", "Rejected"];

type OrderDraft = {
  status: string;
  courierName: string;
  courierPhone: string;
  trackingCode: string;
  adminNote: string;

  paymentStatus: string;
  paymentPhone: string;
  paymentReference: string;
  paymentNote: string;
  escrowStatus: string;

  refundStatus: string;
  refundReason: string;
  disputeStatus: string;
  disputeReason: string;
};

export default function AdminOrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({});
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

      const draftData: Record<string, OrderDraft> = {};

      databaseOrders.forEach((order) => {
        draftData[order.id] = {
          status: order.status || "Pending Payment",
          courierName: order.fulfillment?.courierName || "",
          courierPhone: order.fulfillment?.courierPhone || "",
          trackingCode: order.fulfillment?.trackingCode || "",
          adminNote: order.fulfillment?.adminNote || "",

          paymentStatus: order.payment?.status || "Pending",
          paymentPhone: order.payment?.phone || "",
          paymentReference: order.payment?.reference || "",
          paymentNote: order.payment?.note || "",
          escrowStatus: order.payment?.escrowStatus || "Held",

          refundStatus: order.customerAction?.refundStatus || "None",
          refundReason: order.customerAction?.refundReason || "",
          disputeStatus: order.customerAction?.disputeStatus || "None",
          disputeReason: order.customerAction?.disputeReason || "",
        };
      });

      setDrafts(draftData);
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

  function updateDraft(orderId: string, field: keyof OrderDraft, value: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: {
        ...currentDrafts[orderId],
        [field]: value,
      },
    }));
  }

  function confirmPaymentQuick(orderId: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: {
        ...currentDrafts[orderId],
        paymentStatus: "Confirmed",
        status: "Payment Confirmed",
        escrowStatus: "Held",
        paymentNote:
          currentDrafts[orderId]?.paymentNote ||
          "Payment confirmed by admin.",
      },
    }));
  }

  function approveRefundQuick(orderId: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: {
        ...currentDrafts[orderId],
        refundStatus: "Approved",
        disputeStatus: currentDrafts[orderId]?.disputeStatus || "None",
        paymentStatus: "Refunded",
        escrowStatus: "Refunded",
        status: "Refunded",
        paymentNote:
          currentDrafts[orderId]?.paymentNote ||
          "Refund approved by admin. Escrow marked as refunded.",
      },
    }));
  }

  function rejectRefundQuick(orderId: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: {
        ...currentDrafts[orderId],
        refundStatus: "Rejected",
        escrowStatus: "Held",
        paymentNote:
          currentDrafts[orderId]?.paymentNote ||
          "Refund rejected after admin review.",
      },
    }));
  }

  function resolveDisputeQuick(orderId: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: {
        ...currentDrafts[orderId],
        disputeStatus: "Resolved",
        escrowStatus: "Held",
        paymentNote:
          currentDrafts[orderId]?.paymentNote ||
          "Dispute resolved after admin review.",
      },
    }));
  }

  async function handleSaveOrder(orderId: string) {
    const draft = drafts[orderId];

    if (!draft) {
      setMessage("No order details found for this order.");
      return;
    }

    try {
      await updateDatabaseOrderDetails({
        orderId,
        status: draft.status,
        courierName: draft.courierName,
        courierPhone: draft.courierPhone,
        trackingCode: draft.trackingCode,
        adminNote: draft.adminNote,

        paymentStatus: draft.paymentStatus,
        paymentPhone: draft.paymentPhone,
        paymentReference: draft.paymentReference,
        paymentNote: draft.paymentNote,
        escrowStatus: draft.escrowStatus,

        refundStatus: draft.refundStatus,
        refundReason: draft.refundReason,
        disputeStatus: draft.disputeStatus,
        disputeReason: draft.disputeReason,
      });

      setMessage("Order review details updated successfully.");
      await loadOrders();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update order details."
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
            Manage Ghana payments, escrow, delivery workflow, refunds, and
            disputes.
          </p>
        </div>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {orders.map((order) => {
          const draft = drafts[order.id];
          const hasRefundRequest =
            order.customerAction?.refundStatus &&
            order.customerAction.refundStatus !== "None";
          const hasDispute =
            order.customerAction?.disputeStatus &&
            order.customerAction.disputeStatus !== "None";

          return (
            <div
              key={order.id}
              className="rounded-xl border border-gray-200 p-5"
            >
              <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Order {order.id}
                  </h3>

                  <p className="mt-1 text-gray-600">{order.createdAt}</p>

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
                      Payment Method: {order.paymentMethod || "Not specified"}
                    </p>
                  </div>

                  {order.payment && (
                    <div className="mt-4 rounded-xl bg-yellow-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Payment Snapshot
                      </p>

                      <p className="mt-2 text-gray-700">
                        Status: {order.payment.status}
                      </p>

                      <p className="mt-1 text-gray-700">
                        Payment Phone: {order.payment.phone || "Not provided"}
                      </p>

                      <p className="mt-1 text-gray-700">
                        Reference: {order.payment.reference || "Not provided"}
                      </p>

                      <p className="mt-1 text-gray-700">
                        Escrow: {order.payment.escrowStatus || "Held"}
                      </p>

                      {order.payment.confirmedAt && (
                        <p className="mt-1 text-gray-700">
                          Confirmed At: {order.payment.confirmedAt}
                        </p>
                      )}
                    </div>
                  )}

                  {order.customerAction && (
                    <div
                      className={`mt-4 rounded-xl p-4 ${
                        hasRefundRequest || hasDispute
                          ? "bg-red-50"
                          : "bg-blue-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">
                        Buyer Protection Snapshot
                      </p>

                      {order.customerAction.deliveryConfirmedAt ? (
                        <p className="mt-2 text-gray-700">
                          Delivery Confirmed At:{" "}
                          {order.customerAction.deliveryConfirmedAt}
                        </p>
                      ) : (
                        <p className="mt-2 text-gray-700">
                          Delivery not yet confirmed by customer.
                        </p>
                      )}

                      <p className="mt-1 text-gray-700">
                        Refund Status:{" "}
                        {order.customerAction.refundStatus || "None"}
                      </p>

                      {order.customerAction.refundReason && (
                        <p className="mt-1 text-gray-700">
                          Refund Reason: {order.customerAction.refundReason}
                        </p>
                      )}

                      <p className="mt-1 text-gray-700">
                        Dispute Status:{" "}
                        {order.customerAction.disputeStatus || "None"}
                      </p>

                      {order.customerAction.disputeReason && (
                        <p className="mt-1 text-gray-700">
                          Dispute Reason: {order.customerAction.disputeReason}
                        </p>
                      )}
                    </div>
                  )}

                  {order.delivery && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Ghana Delivery Details
                      </p>

                      <p className="mt-2 text-gray-600">
                        Delivery Location: {order.delivery.city},{" "}
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

                {draft && (
                  <div className="space-y-5">
                    <div className="rounded-xl bg-yellow-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-semibold text-gray-900">
                          Payment Confirmation
                        </h4>

                        <button
                          type="button"
                          onClick={() => confirmPaymentQuick(order.id)}
                          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                        >
                          Quick Confirm
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Payment Status
                          </label>

                          <select
                            value={draft.paymentStatus}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "paymentStatus",
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          >
                            {paymentStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Escrow Status
                          </label>

                          <select
                            value={draft.escrowStatus}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "escrowStatus",
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          >
                            {escrowStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Payment Phone
                          </label>

                          <input
                            type="tel"
                            value={draft.paymentPhone}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "paymentPhone",
                                event.target.value
                              )
                            }
                            placeholder="Example: 0241234567"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Payment Reference
                          </label>

                          <input
                            type="text"
                            value={draft.paymentReference}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "paymentReference",
                                event.target.value
                              )
                            }
                            placeholder="Example: MOMO-REF-12345"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Payment Note
                        </label>

                        <textarea
                          value={draft.paymentNote}
                          onChange={(event) =>
                            updateDraft(
                              order.id,
                              "paymentNote",
                              event.target.value
                            )
                          }
                          placeholder="Example: MTN MoMo received and verified manually."
                          rows={3}
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-red-50 p-4">
                      <h4 className="font-semibold text-gray-900">
                        Refund and Dispute Review
                      </h4>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Refund Status
                          </label>

                          <select
                            value={draft.refundStatus}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "refundStatus",
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          >
                            {refundStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Dispute Status
                          </label>

                          <select
                            value={draft.disputeStatus}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "disputeStatus",
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          >
                            {disputeStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Refund Reason / Admin Review Note
                        </label>

                        <textarea
                          value={draft.refundReason}
                          onChange={(event) =>
                            updateDraft(
                              order.id,
                              "refundReason",
                              event.target.value
                            )
                          }
                          rows={3}
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Dispute Reason / Admin Review Note
                        </label>

                        <textarea
                          value={draft.disputeReason}
                          onChange={(event) =>
                            updateDraft(
                              order.id,
                              "disputeReason",
                              event.target.value
                            )
                          }
                          rows={3}
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        />
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => approveRefundQuick(order.id)}
                          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                        >
                          Approve Refund
                        </button>

                        <button
                          type="button"
                          onClick={() => rejectRefundQuick(order.id)}
                          className="rounded-lg border border-orange-300 px-4 py-2 text-sm text-orange-700"
                        >
                          Reject Refund
                        </button>

                        <button
                          type="button"
                          onClick={() => resolveDisputeQuick(order.id)}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900"
                        >
                          Resolve Dispute
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <h4 className="font-semibold text-gray-900">
                        Fulfilment Workflow
                      </h4>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Order Status
                          </label>

                          <select
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(order.id, "status", event.target.value)
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Courier / Rider Name
                            </label>

                            <input
                              type="text"
                              value={draft.courierName}
                              onChange={(event) =>
                                updateDraft(
                                  order.id,
                                  "courierName",
                                  event.target.value
                                )
                              }
                              placeholder="Example: Kwame Mensah"
                              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Courier / Rider Phone
                            </label>

                            <input
                              type="tel"
                              value={draft.courierPhone}
                              onChange={(event) =>
                                updateDraft(
                                  order.id,
                                  "courierPhone",
                                  event.target.value
                                )
                              }
                              placeholder="Example: 0241234567"
                              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tracking Code
                          </label>

                          <input
                            type="text"
                            value={draft.trackingCode}
                            onChange={(event) =>
                              updateDraft(
                                order.id,
                                "trackingCode",
                                event.target.value
                              )
                            }
                            placeholder="Example: MS-GH-1001"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Internal Admin Note
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
                            placeholder="Example: Customer prefers evening delivery."
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                          />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleSaveOrder(order.id)}
                            className="rounded-lg bg-black px-5 py-2 text-white"
                          >
                            Save Order Updates
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="rounded-lg border border-red-300 px-5 py-2 text-red-600"
                          >
                            Delete Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

              <div className="mt-5 flex justify-between border-t pt-5">
                <p className="text-lg font-bold text-gray-900">Total</p>

                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}