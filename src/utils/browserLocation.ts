export type BrowserLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: number;
};

function getLocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Enable location access in your browser and try again.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your current location is unavailable. Check GPS, network, and browser location settings.";
  }

  if (error.code === error.TIMEOUT) {
    return "Location request timed out. Move to an area with better GPS or network coverage and try again.";
  }

  return "Unable to capture your current location.";
}

function ensureGeolocationAvailable() {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error(
      "Your browser does not support phone location capture."
    );
  }
}

export function getCurrentBrowserLocation(): Promise<BrowserLocation> {
  ensureGeolocationAvailable();

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: Date.now(),
        });
      },
      (error) => {
        reject(new Error(getLocationErrorMessage(error)));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 15000,
      }
    );
  });
}

export function startBrowserLocationWatch(
  onLocation: (location: BrowserLocation) => void,
  onError: (message: string) => void
) {
  ensureGeolocationAvailable();

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: Date.now(),
      });
    },
    (error) => {
      onError(getLocationErrorMessage(error));
    },
    {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 15000,
    }
  );
}

export function stopBrowserLocationWatch(watchId: number) {
  if (typeof window !== "undefined" && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

export function calculateDistanceMeters(
  from: Pick<BrowserLocation, "latitude" | "longitude">,
  to: Pick<BrowserLocation, "latitude" | "longitude">
) {
  const earthRadiusMeters = 6371000;

  const latitudeDifference = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDifference = ((to.longitude - from.longitude) * Math.PI) / 180;

  const latitudeOne = (from.latitude * Math.PI) / 180;
  const latitudeTwo = (to.latitude * Math.PI) / 180;

  const haversineValue =
    Math.sin(latitudeDifference / 2) *
      Math.sin(latitudeDifference / 2) +
    Math.cos(latitudeOne) *
      Math.cos(latitudeTwo) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
  );
}