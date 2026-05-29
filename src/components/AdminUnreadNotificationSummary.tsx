"use client";

import { useEffect, useState } from "react";
import {
  AdminUnreadNotificationSummary as Summary,
  getAdminUnreadNotificationSummary,
} from "@/utils/adminNotificationService";

export default function AdminUnreadNotificationSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();

    window.addEventListener("adminNotificationsUpdated", loadSummary);

    return () => {
      window.removeEventListener("adminNotificationsUpdated", loadSummary);
    };
  }, []);

  async function loadSummary() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getAdminUnreadNotificationSummary();

      setSummary(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load admin notification summary."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading admin alerts...</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-red-600">{message}</p>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Admin Alert Center
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {summary.unreadCount} Unread Admin Notification
            {summary.unreadCount === 1 ? "" : "s"}
          </h2>

          <p className="mt-2 text-gray-600">
            New seller applications, product review requests, customer refund
            requests, disputes, payments, and delivery confirmations appear here.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSummary}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Alerts
        </button>
      </div>

      {summary.latestUnread.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {summary.latestUnread.map((notification) => (
            <div
              key={notification.id}
              className="rounded-xl border border-yellow-300 bg-yellow-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {notification.type}
              </p>

              <h3 className="mt-1 font-bold text-gray-900">
                {notification.title}
              </h3>

              <p className="mt-2 text-sm text-gray-700">
                {notification.message}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {notification.createdAt}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-gray-600">
          No unread admin notifications at the moment.
        </p>
      )}
    </div>
  );
}