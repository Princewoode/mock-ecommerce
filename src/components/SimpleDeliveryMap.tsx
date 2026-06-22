import {
  buildGoogleMapsLink,
  buildOpenStreetMapEmbedUrl,
  formatCoordinateLabel,
  hasCoordinates,
} from "@/utils/mapUtils";

type SimpleDeliveryMapProps = {
  title?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  currentLat?: number;
  currentLng?: number;
  locationNote?: string;
};

export default function SimpleDeliveryMap({
  title = "Delivery Map",
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  currentLat,
  currentLng,
  locationNote,
}: SimpleDeliveryMapProps) {
  const currentCoordinate = {
    latitude: currentLat,
    longitude: currentLng,
  };

  const dropoffCoordinate = {
    latitude: dropoffLat,
    longitude: dropoffLng,
  };

  const pickupCoordinate = {
    latitude: pickupLat,
    longitude: pickupLng,
  };

  const displayCoordinate = hasCoordinates(currentCoordinate)
    ? currentCoordinate
    : hasCoordinates(dropoffCoordinate)
      ? dropoffCoordinate
      : hasCoordinates(pickupCoordinate)
        ? pickupCoordinate
        : null;

  if (!displayCoordinate || !hasCoordinates(displayCoordinate)) {
    return (
      <div className="rounded-xl bg-gray-50 p-5">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="mt-2 text-gray-600">
          Map coordinates have not been added yet.
        </p>
      </div>
    );
  }

  const latitude = displayCoordinate.latitude as number;
  const longitude = displayCoordinate.longitude as number;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>

          <p className="mt-1 text-sm text-gray-600">
            Showing{" "}
            {hasCoordinates(currentCoordinate)
              ? "current driver location"
              : hasCoordinates(dropoffCoordinate)
                ? "drop-off location"
                : "pickup location"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatCoordinateLabel({ latitude, longitude })}
          </p>
        </div>

        <a
          href={buildGoogleMapsLink({ latitude, longitude })}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-black px-5 py-2 text-center text-sm font-semibold text-white"
        >
          Open in Maps
        </a>
      </div>

      {locationNote && (
        <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          {locationNote}
        </p>
      )}

      <iframe
        title={title}
        src={buildOpenStreetMapEmbedUrl({ latitude, longitude })}
        className="mt-4 h-72 w-full rounded-xl border border-gray-200"
        loading="lazy"
      />

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pickup
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {formatCoordinateLabel({
              latitude: pickupLat,
              longitude: pickupLng,
            })}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Current
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {formatCoordinateLabel({
              latitude: currentLat,
              longitude: currentLng,
            })}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Drop-off
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {formatCoordinateLabel({
              latitude: dropoffLat,
              longitude: dropoffLng,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}