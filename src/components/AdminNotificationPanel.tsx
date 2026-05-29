"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNotification } from "@/types/models";
import {
  getAdminNotifications,
  markAdminNotificationRead,
} from "@/utils/adminNotificationService";

export default function AdminNotificationPanel() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getAdminNotifications();

      setNotifications(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load admin notifications."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkRead(notificationId: string) {
    try {
      await markAdminNotificationRead(notificationId);
      await loadNotifications();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update notification."
      );
    }
  }

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Admin Notifications
        </h2>

        <p className="mt-4 text-gray-600">Loading admin notifications...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Admin Notifications
          </h2>

          <p className="mt-2 text-gray-600">
            New orders and operational marketplace alerts appear here.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Unread admin notifications: {unreadCount}
          </p>
        </div>

        <button
          type="button"
          onClick={loadNotifications}
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

      {notifications.length === 0 ? (
        <p className="mt-6 text-gray-600">No admin notifications yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {notifications.slice(0, 8).map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-4 ${
                notification.isRead
                  ? "border-gray-200 bg-gray-50"
                  : "border-yellow-300 bg-yellow-50"
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
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

              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(notification.id)}
                  className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}