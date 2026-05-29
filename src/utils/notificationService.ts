import { AppNotification } from "@/types/models";
import { supabase } from "@/lib/supabaseClient";

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in before viewing notifications.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(response: Response) {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned a non-JSON response. Check notification API route. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(result.message || "Notification request failed.");
  }

  return result;
}

export async function getUserNotifications(): Promise<AppNotification[]> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/notifications", {
    headers: {
      ...authHeaders,
    },
  });

  const result = await handleResponse(response);

  return result.notifications || [];
}

export async function markNotificationRead(notificationId: string) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/notifications", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      notificationId,
    }),
  });

  return handleResponse(response);
}