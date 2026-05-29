import { AppNotification } from "@/types/models";

const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

export type AdminUnreadNotificationSummary = {
  unreadCount: number;
  latestUnread: {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
  }[];
};

function getAdminApiPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ADMIN_API_PASSWORD_KEY) || "";
}

async function handleResponse(response: Response) {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check admin notification API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Admin notification request failed.");
  }

  return result;
}

export async function getAdminNotifications(): Promise<AppNotification[]> {
  const response = await fetch("/api/admin/notifications", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  const result = await handleResponse(response);

  return result.notifications || [];
}

export async function getAdminUnreadNotificationSummary(): Promise<AdminUnreadNotificationSummary> {
  const response = await fetch("/api/admin/notifications/unread-count", {
    headers: {
      "x-admin-password": getAdminApiPassword(),
    },
  });

  return handleResponse(response);
}

export async function markAdminNotificationRead(notificationId: string) {
  const response = await fetch("/api/admin/notifications", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getAdminApiPassword(),
    },
    body: JSON.stringify({
      notificationId,
    }),
  });

  return handleResponse(response);
}