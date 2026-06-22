export type MapCoordinate = {
  latitude?: number | null;
  longitude?: number | null;
};

export function parseCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return numericValue;
}

export function hasCoordinates(coordinate: MapCoordinate) {
  return (
    typeof coordinate.latitude === "number" &&
    Number.isFinite(coordinate.latitude) &&
    typeof coordinate.longitude === "number" &&
    Number.isFinite(coordinate.longitude)
  );
}

export function buildOpenStreetMapEmbedUrl({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const delta = 0.015;

  const left = longitude - delta;
  const right = longitude + delta;
  const bottom = latitude - delta;
  const top = latitude + delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${latitude},${longitude}`;
}

export function buildGoogleMapsLink({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function formatCoordinateLabel({
  latitude,
  longitude,
}: {
  latitude?: number | null;
  longitude?: number | null;
}) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "Coordinates not available";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}