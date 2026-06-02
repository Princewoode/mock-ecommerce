"use client";

import { useEffect, useMemo, useState } from "react";
import { DeliveryDriverProfile } from "@/types/models";
import {
  getAdminDeliveryDrivers,
  updateAdminDeliveryDriver,
} from "@/utils/adminDeliveryDriverService";

const driverStatuses = ["Pending", "Verified", "Rejected", "Suspended"];

function DriverStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

export default function AdminDeliveryDriverManager() {
  const [drivers, setDrivers] = useState<DeliveryDriverProfile[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [platformPhoneDrafts, setPlatformPhoneDrafts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getAdminDeliveryDrivers();

      setDrivers(result);

      const statusData: Record<string, string> = {};
      const noteData: Record<string, string> = {};
      const phoneData: Record<string, string> = {};

      result.forEach((driver) => {
        statusData[driver.id] = driver.status;
        noteData[driver.id] = driver.verificationNote || "";
        phoneData[driver.id] = driver.platformPhone || driver.phone || "";
      });

      setStatusDrafts(statusData);
      setNoteDrafts(noteData);
      setPlatformPhoneDrafts(phoneData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery drivers."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateDriver(driverId: string) {
    try {
      const result = await updateAdminDeliveryDriver({
        driverId,
        status: statusDrafts[driverId] || "Pending",
        verificationNote: noteDrafts[driverId] || "",
        platformPhone: platformPhoneDrafts[driverId] || "",
      });

      setMessage(result.message || "Delivery driver updated.");
      await loadDrivers();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update delivery driver."
      );
    }
  }

  function updateStatusDraft(driverId: string, value: string) {
    setStatusDrafts((current) => ({
      ...current,
      [driverId]: value,
    }));
  }

  function updateNoteDraft(driverId: string, value: string) {
    setNoteDrafts((current) => ({
      ...current,
      [driverId]: value,
    }));
  }

  function updatePlatformPhoneDraft(driverId: string, value: string) {
    setPlatformPhoneDrafts((current) => ({
      ...current,
      [driverId]: value,
    }));
  }

  const summary = useMemo(() => {
    return drivers.reduce(
      (totals, driver) => {
        totals.total += 1;

        if (driver.status === "Pending") {
          totals.pending += 1;
        }

        if (driver.status === "Verified") {
          totals.verified += 1;
        }

        if (driver.status === "Rejected") {
          totals.rejected += 1;
        }

        if (driver.status === "Suspended") {
          totals.suspended += 1;
        }

        if (driver.interCityRoutes?.trim()) {
          totals.interCity += 1;
        }

        if (driver.intraCityZones?.trim()) {
          totals.intraCity += 1;
        }

        return totals;
      },
      {
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        suspended: 0,
        intraCity: 0,
        interCity: 0,
      }
    );
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return drivers.filter((driver) => {
      const matchesStatus =
        statusFilter === "All" || driver.status === statusFilter;

      const searchableText = [
        driver.fullName,
        driver.phone,
        driver.platformPhone || "",
        driver.region,
        driver.city,
        driver.vehicleType,
        driver.vehicleNumber || "",
        driver.intraCityZones || "",
        driver.interCityRoutes || "",
        driver.availability || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [drivers, statusFilter, searchTerm]);

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Delivery Driver Registry
        </h2>

        <p className="mt-4 text-gray-600">Loading delivery drivers...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Driver Registry
          </h2>

          <p className="mt-2 text-gray-600">
            Review delivery driver applications, verify route coverage, assign
            platform contact numbers, and manage intra-city and inter-city
            delivery partners.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDrivers}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Drivers
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <DriverStatCard
          label="Total Applications"
          value={summary.total}
          helper="All delivery driver records"
        />

        <DriverStatCard
          label="Pending Review"
          value={summary.pending}
          helper="Need admin verification"
        />

        <DriverStatCard
          label="Verified Drivers"
          value={summary.verified}
          helper="Can receive assignments later"
        />

        <DriverStatCard
          label="Suspended / Rejected"
          value={summary.suspended + summary.rejected}
          helper="Not active for delivery"
        />

        <DriverStatCard
          label="Intra-city Coverage"
          value={summary.intraCity}
          helper="Drivers with city-zone coverage"
        />

        <DriverStatCard
          label="Inter-city Coverage"
          value={summary.interCity}
          helper="Drivers with regional route coverage"
        />

        <DriverStatCard
          label="Regions Covered"
          value={
            new Set(drivers.map((driver) => driver.region).filter(Boolean)).size
          }
          helper="Unique driver regions"
        />

        <DriverStatCard
          label="Vehicle Types"
          value={
            new Set(drivers.map((driver) => driver.vehicleType).filter(Boolean))
              .size
          }
          helper="Motorbike, car, van, truck, carrier"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Filter by Status
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="All">All Statuses</option>
            {driverStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search Driver / Route / City
          </label>

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Example: Accra, Kumasi, Motorbike, Accra to Takoradi"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      {filteredDrivers.length === 0 ? (
        <p className="mt-6 text-gray-600">
          No delivery drivers match this filter.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-xl border border-gray-200 p-5"
            >
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Delivery Driver
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        {driver.fullName}
                      </h3>

                      <p className="mt-1 text-gray-600">
                        {driver.city}, {driver.region}
                      </p>

                      <p
                        className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                          driver.status === "Verified"
                            ? "bg-green-50 text-green-700"
                            : driver.status === "Pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        Status: {driver.status}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-semibold text-gray-900">
                        {driver.vehicleType}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Vehicle: {driver.vehicleNumber || "Not provided"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Applied: {driver.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Contact Details
                      </p>

                      <p className="mt-2 text-gray-600">
                        Personal Phone: {driver.phone}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Platform Phone:{" "}
                        {driver.platformPhone || "Not assigned"}
                      </p>

                      <p className="mt-1 text-gray-600">
                        MoMo: {driver.momoNumber}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Emergency:{" "}
                        {driver.emergencyContact || "Not provided"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Verification Details
                      </p>

                      <p className="mt-2 text-gray-600">
                        License: {driver.licenseNumber || "Not provided"}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Ghana Card / ID:{" "}
                        {driver.ghanaCardReference || "Not provided"}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Availability: {driver.availability || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Intra-city Zones
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-gray-700">
                        {driver.intraCityZones || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-purple-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Inter-city Routes
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-gray-700">
                        {driver.interCityRoutes || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {driver.driverNote && (
                    <div className="mt-5 rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Driver Note
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-gray-700">
                        {driver.driverNote}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="font-semibold text-gray-900">
                    Admin Verification
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Verify the driver only after checking phone, route coverage,
                    vehicle details, and identity references. Verified drivers
                    can later be assigned delivery packages.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Driver Status
                      </label>

                      <select
                        value={statusDrafts[driver.id] || driver.status}
                        onChange={(event) =>
                          updateStatusDraft(driver.id, event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      >
                        {driverStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Platform Delivery Phone
                      </label>

                      <input
                        value={
                          platformPhoneDrafts[driver.id] ||
                          driver.platformPhone ||
                          driver.phone
                        }
                        onChange={(event) =>
                          updatePlatformPhoneDraft(driver.id, event.target.value)
                        }
                        placeholder="Example: 0241234567"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        This number will later be shown to customers after a
                        delivery driver is assigned to their order.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Verification Note
                      </label>

                      <textarea
                        value={noteDrafts[driver.id] || ""}
                        onChange={(event) =>
                          updateNoteDraft(driver.id, event.target.value)
                        }
                        placeholder="Example: Verified phone and Accra East route coverage."
                        rows={5}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdateDriver(driver.id)}
                      className="rounded-lg bg-black px-6 py-3 text-white"
                    >
                      Save Driver Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}