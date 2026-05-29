"use client";

import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/utils/notificationService";

export default function NotificationNavBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const count = await getUnreadNotificationCount();

        if (isMounted) {
          setUnreadCount(count);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 30000);

    window.addEventListener("notificationsUpdated", loadUnreadCount);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("notificationsUpdated", loadUnreadCount);
    };
  }, []);

  if (unreadCount <= 0) {
    return null;
  }

  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}