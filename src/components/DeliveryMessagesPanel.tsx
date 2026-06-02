"use client";

import { useEffect, useState } from "react";
import { DeliveryMessage } from "@/types/models";
import {
  getDeliveryMessages,
  sendDeliveryMessage,
} from "@/utils/deliveryMessageService";

type DeliveryMessagesPanelProps = {
  orderId: string;
  viewerRole: "customer" | "driver" | "admin";
};

function getRoleLabel(role: string) {
  if (role === "customer") {
    return "Customer";
  }

  if (role === "driver") {
    return "Driver";
  }

  return "Admin";
}

function getRoleStyle(role: string) {
  if (role === "customer") {
    return "bg-blue-50 text-blue-700";
  }

  if (role === "driver") {
    return "bg-green-50 text-green-700";
  }

  return "bg-black text-white";
}

export default function DeliveryMessagesPanel({
  orderId,
  viewerRole,
}: DeliveryMessagesPanelProps) {
  const [messages, setMessages] = useState<DeliveryMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [orderId, viewerRole]);

  async function loadMessages() {
    try {
      setIsLoading(true);
      setStatusMessage("");

      const result = await getDeliveryMessages({
        orderId,
        viewerRole,
      });

      setMessages(result);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery messages."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!messageText.trim()) {
      setStatusMessage("Please enter a delivery message.");
      return;
    }

    try {
      setIsSending(true);
      setStatusMessage("");

      const result = await sendDeliveryMessage({
        orderId,
        viewerRole,
        message: messageText,
        isInternal: viewerRole === "admin" ? isInternal : false,
      });

      setStatusMessage(result.message || "Message sent.");
      setMessageText("");
      setIsInternal(false);
      await loadMessages();

      window.dispatchEvent(new Event("notificationsUpdated"));
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to send delivery message."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Messages
          </h2>

          <p className="mt-2 text-gray-600">
            Share delivery instructions, landmarks, pickup timing, and route
            updates for this order.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMessages}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Messages
        </button>
      </div>

      {statusMessage && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {statusMessage}
        </div>
      )}

      {isLoading ? (
        <p className="mt-5 text-gray-600">Loading delivery messages...</p>
      ) : messages.length === 0 ? (
        <p className="mt-5 text-gray-600">
          No delivery messages yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {messages.map((deliveryMessage) => (
            <div
              key={deliveryMessage.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="flex flex-col justify-between gap-2 md:flex-row">
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getRoleStyle(
                      deliveryMessage.senderRole
                    )}`}
                  >
                    {getRoleLabel(deliveryMessage.senderRole)}
                  </span>

                  {deliveryMessage.isInternal && (
                    <span className="ml-2 inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Internal Admin Note
                    </span>
                  )}

                  <p className="mt-2 font-semibold text-gray-900">
                    {deliveryMessage.senderName}
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  {deliveryMessage.createdAt}
                </p>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-gray-700">
                {deliveryMessage.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-gray-50 p-5">
        <label className="block text-sm font-medium text-gray-700">
          New Delivery Message
        </label>

        <textarea
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder={
            viewerRole === "customer"
              ? "Example: Please call me when you reach the Goil station."
              : viewerRole === "driver"
                ? "Example: I am close to East Legon tunnel."
                : "Example: Driver should call customer before reaching the landmark."
          }
          rows={4}
          maxLength={700}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
        />

        <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <p className="text-sm text-gray-500">
            {messageText.length}/700 characters
          </p>

          {viewerRole === "admin" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(event) => setIsInternal(event.target.checked)}
              />
              Internal admin note only
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={isSending}
          className="mt-4 rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
        >
          {isSending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </section>
  );
}