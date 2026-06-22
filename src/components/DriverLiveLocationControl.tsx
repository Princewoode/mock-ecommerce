"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserLocation,
  calculateDistanceMeters,
  getCurrentBrowserLocation,
  startBrowserLocationWatch,
  stopBrowserLocationWatch,
} from "@/utils/browserLocation";
import { updateDriverLiveLocation } from "@/utils/driverDeliveryService";
import { formatCoordinateLabel } from "@/utils/mapUtils";

type SavedLocation = BrowserLocation & {
  savedAt: number;
};

type DriverLiveLocationControlProps = {
  assignmentId: string;
  assignmentStatus: string;
  currentLat?: number;
  currentLng?: number;
  currentAccuracyMeters?: number;
  currentLocationNote?: string;
  lastLocationAt?: string;
};

const LOCATION_UPDATE_INTERVAL_MS = 60000;
const MINIMUM_MOVEMENT_METERS = 75;

export default function DriverLiveLocationControl({
  assignmentId,
  assignmentStatus,
  currentLat,
  currentLng,
  currentAccuracyMeters,
  currentLocationNote,
  lastLocationAt,
}: DriverLiveLocationControlProps) {
  const [locationNote, setLocationNote] = useState(
    currentLocationNote || ""
  );

  const [latestLocation, setLatestLocation] =
    useState<BrowserLocation | null>(
      typeof currentLat === "number" && typeof currentLng === "number"
        ? {
            latitude: currentLat,
            longitude: currentLng,
            accuracy: currentAccuracyMeters,
            capturedAt: Date.now(),
          }
        : null
    );

  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [message, setMessage] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastSavedLocationRef = useRef<SavedLocation | null>(null);
  const isSavingRef = useRef(false);

  const isCompleted = ["Delivered", "Failed Attempt"].includes(
    assignmentStatus
  );

  function clearLocationWatch() {
    if (watchIdRef.current !== null) {
      stopBrowserLocationWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsSharing(false);
  }

  useEffect(() => {
    return () => {
      clearLocationWatch();
    };
  }, []);

  async function saveLocation(
    location: BrowserLocation,
    sourceLabel: string
  ) {
    if (isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);

      const result = await updateDriverLiveLocation({
        assignmentId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        locationNote,
      });

      lastSavedLocationRef.current = {
        ...location,
        savedAt: Date.now(),
      };

      setMessage(
        `${sourceLabel} saved. ${result.location?.updatedAt || ""}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save your current location."
      );
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  async function capturePhoneLocation() {
    try {
      setIsCapturing(true);
      setMessage("Requesting your phone location...");

      const location = await getCurrentBrowserLocation();

      setLatestLocation(location);
      await saveLocation(location, "Phone location");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to capture phone location."
      );
    } finally {
      setIsCapturing(false);
    }
  }

  function startLiveSharing() {
    try {
      if (watchIdRef.current !== null) {
        return;
      }

      setMessage(
        "Live sharing started. Your location will update while this dashboard remains open."
      );

      const watchId = startBrowserLocationWatch(
        (location) => {
          setLatestLocation(location);

          const lastSaved = lastSavedLocationRef.current;

          const hasMovedEnough =
            !lastSaved ||
            calculateDistanceMeters(lastSaved, location) >=
              MINIMUM_MOVEMENT_METERS;

          const updateIsDue =
            !lastSaved ||
            Date.now() - lastSaved.savedAt >= LOCATION_UPDATE_INTERVAL_MS;

          if (hasMovedEnough && updateIsDue) {
            void saveLocation(location, "Live location");
          }
        },
        (locationErrorMessage) => {
          setMessage(locationErrorMessage);
          clearLocationWatch();
        }
      );

      watchIdRef.current = watchId;
      setIsSharing(true);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start live location sharing."
      );
    }
  }

  async function saveManualLocation() {
    const latitude = Number(manualLatitude);
    const longitude = Number(manualLongitude);

    if (
      !manualLatitude.trim() ||
      !manualLongitude.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setMessage("Enter valid latitude and longitude values.");
      return;
    }

    const location: BrowserLocation = {
      latitude,
      longitude,
      capturedAt: Date.now(),
    };

    setLatestLocation(location);
    await saveLocation(location, "Manual location");
  }

  return (
    <div className="mt-5 rounded-xl bg-emerald-50 p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="font-semibold text-gray-900">
            Phone Location Sharing
          </p>

          <p className="mt-1 text-sm text-gray-700">
            Share your current delivery position without manually typing
            coordinates.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isSharing
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          {isSharing ? "Live Sharing Active" : "Location Not Sharing"}
        </span>
      </div>

      {latestLocation && (
        <div className="mt-4 rounded-lg bg-white p-3 text-sm text-gray-700">
          <p>
            Current coordinates:{" "}
            {formatCoordinateLabel({
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
            })}
          </p>

          {typeof latestLocation.accuracy === "number" && (
            <p className="mt-1">
              GPS accuracy: approximately ±
              {Math.round(latestLocation.accuracy)} metres
            </p>
          )}

          {lastLocationAt && (
            <p className="mt-1 text-xs text-gray-500">
              Last saved location: {lastLocationAt}
            </p>
          )}
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-white p-3 text-sm text-gray-700">
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={capturePhoneLocation}
          disabled={isCompleted || isCapturing || isSaving}
          className="rounded-lg bg-black px-5 py-3 text-white disabled:bg-gray-400"
        >
          {isCapturing
            ? "Finding Location..."
            : isSaving
              ? "Saving Location..."
              : "Use Phone Location Now"}
        </button>

        {!isSharing ? (
          <button
            type="button"
            onClick={startLiveSharing}
            disabled={isCompleted}
            className="rounded-lg border border-green-600 px-5 py-3 font-semibold text-green-700 disabled:border-gray-300 disabled:text-gray-400"
          >
            Start Live Sharing
          </button>
        ) : (
          <button
            type="button"
            onClick={clearLocationWatch}
            className="rounded-lg border border-red-500 px-5 py-3 font-semibold text-red-700"
          >
            Stop Live Sharing
          </button>
        )}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Current Location Note
        </label>

        <input
          value={locationNote}
          onChange={(event) => setLocationNote(event.target.value)}
          placeholder="Example: Near Kwame Nkrumah Circle, heading to Accra Mall"
          maxLength={280}
          disabled={isCompleted}
          className="mt-2 w-full rounded-lg border border-green-200 px-4 py-3 disabled:bg-gray-100"
        />
      </div>

      <details className="mt-4 rounded-lg bg-white p-4">
        <summary className="cursor-pointer font-semibold text-gray-900">
          Manual coordinate fallback
        </summary>

        <p className="mt-2 text-sm text-gray-600">
          Use this only if phone location permission is unavailable.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={manualLatitude}
            onChange={(event) => setManualLatitude(event.target.value)}
            placeholder="Latitude"
            disabled={isCompleted}
            className="rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
          />

          <input
            value={manualLongitude}
            onChange={(event) => setManualLongitude(event.target.value)}
            placeholder="Longitude"
            disabled={isCompleted}
            className="rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
          />
        </div>

        <button
          type="button"
          onClick={saveManualLocation}
          disabled={isCompleted || isSaving}
          className="mt-3 rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-900 disabled:text-gray-400"
        >
          Save Manual Location
        </button>
      </details>
    </div>
  );
}