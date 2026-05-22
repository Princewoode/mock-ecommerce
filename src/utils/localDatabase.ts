export function readLocalData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const savedData = localStorage.getItem(key);

  if (!savedData) {
    return fallback;
  }

  try {
    return JSON.parse(savedData) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalData<T>(
  key: string,
  value: T,
  eventName?: string
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));

  if (eventName) {
    window.dispatchEvent(new Event(eventName));
  }
}

export function removeLocalData(key: string, eventName?: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(key);

  if (eventName) {
    window.dispatchEvent(new Event(eventName));
  }
}