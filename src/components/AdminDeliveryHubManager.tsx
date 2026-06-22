"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DeliveryHub } from "@/types/models";
import { ghanaRegions } from "@/utils/ghanaDelivery";
import { formatCoordinateLabel } from "@/utils/mapUtils";
import {
  createAdminDeliveryHub,
  getAdminDeliveryHubs,
  updateAdminDeliveryHub,
} from "@/utils/adminDeliveryHubService";

type HubForm = {
  hubName: string;
  hubType: string;
  region: string;
  city: string;
  address: string;
  contactPhone: string;
  managerName: string;
  managerPhone: string;
  latitude: string;
  longitude: string;
  operatingHours: string;
  adminNote: string;
  isActive: boolean;
};

const hubTypes = [
  "Cross-Dock",
  "Fulfillment Centre",
  "Inter-city Transfer",
  "Final Mile Station",
];

function emptyHubForm(): HubForm {
  return {
    hubName: "",
    hubType: "Cross-Dock",
    region: "Greater Accra",
    city: "",
    address: "",
    contactPhone: "",
    managerName: "",
    managerPhone: "",
    latitude: "",
    longitude: "",
    operatingHours: "",
    adminNote: "",
    isActive: true,
  };
}

export default function AdminDeliveryHubManager() {
  const [hubs, setHubs] = useState<DeliveryHub[]>([]);
  const [form, setForm] = useState<HubForm>(emptyHubForm());
  const [editingHubId, setEditingHubId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadHubs();
  }, []);

  async function loadHubs() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getAdminDeliveryHubs();
      setHubs(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery hubs."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateForm<K extends keyof HubForm>(
    field: K,
    value: HubForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyHubForm());
    setEditingHubId("");
  }

  function handleEdit(hub: DeliveryHub) {
    setEditingHubId(hub.id);

    setForm({
      hubName: hub.hubName,
      hubType: hub.hubType,
      region: hub.region,
      city: hub.city,
      address: hub.address || "",
      contactPhone: hub.contactPhone || "",
      managerName: hub.managerName || "",
      managerPhone: hub.managerPhone || "",
      latitude:
        typeof hub.latitude === "number" ? String(hub.latitude) : "",
      longitude:
        typeof hub.longitude === "number" ? String(hub.longitude) : "",
      operatingHours: hub.operatingHours || "",
      adminNote: hub.adminNote || "",
      isActive: hub.isActive,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const latitude = form.latitude.trim()
      ? Number(form.latitude)
      : undefined;

    const longitude = form.longitude.trim()
      ? Number(form.longitude)
      : undefined;

    if (
      form.latitude.trim() &&
      form.longitude.trim() &&
      (!Number.isFinite(latitude) || !Number.isFinite(longitude))
    ) {
      setMessage("Enter valid latitude and longitude values.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const payload = {
        hubName: form.hubName.trim(),
        hubType: form.hubType,
        region: form.region,
        city: form.city.trim(),
        address: form.address.trim(),
        contactPhone: form.contactPhone.trim(),
        managerName: form.managerName.trim(),
        managerPhone: form.managerPhone.trim(),
        latitude,
        longitude,
        operatingHours: form.operatingHours.trim(),
        adminNote: form.adminNote.trim(),
      };

      if (!payload.hubName || !payload.region || !payload.city) {
        setMessage("Hub name, region, and city are required.");
        return;
      }

      const result = editingHubId
        ? await updateAdminDeliveryHub({
            hubId: editingHubId,
            ...payload,
            isActive: form.isActive,
          })
        : await createAdminDeliveryHub(payload);

      setMessage(result.message || "Delivery hub saved successfully.");
      resetForm();
      await loadHubs();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save delivery hub."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const summary = useMemo(() => {
    return hubs.reduce(
      (totals, hub) => {
        totals.total += 1;

        if (hub.isActive) {
          totals.active += 1;
        }

        if (hub.hubType === "Inter-city Transfer") {
          totals.interCity += 1;
        }

        if (hub.hubType === "Final Mile Station") {
          totals.finalMile += 1;
        }

        return totals;
      },
      {
        total: 0,
        active: 0,
        interCity: 0,
        finalMile: 0,
      }
    );
  }, [hubs]);

  const filteredHubs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return hubs.filter((hub) => {
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && hub.isActive) ||
        (statusFilter === "Inactive" && !hub.isActive);

      const searchableText = [
        hub.hubName,
        hub.hubType,
        hub.region,
        hub.city,
        hub.address || "",
        hub.managerName || "",
        hub.adminNote || "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!keyword || searchableText.includes(keyword));
    });
  }, [hubs, searchTerm, statusFilter]);

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Hub Management
          </h2>

          <p className="mt-2 text-gray-600">
            Create dispatch hubs, inter-city transfer stations, and final-mile
            delivery bases across Ghana.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadHubs()}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Hubs
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total Hubs</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summary.total}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm text-green-700">Active Hubs</p>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {summary.active}
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-sm text-purple-700">Inter-city Transfer</p>
          <p className="mt-1 text-2xl font-bold text-purple-900">
            {summary.interCity}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Final-mile Stations</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {summary.finalMile}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl bg-gray-50 p-5"
      >
        <h3 className="text-lg font-bold text-gray-900">
          {editingHubId ? "Edit Delivery Hub" : "Create Delivery Hub"}
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hub Name
            </label>

            <input
              value={form.hubName}
              onChange={(event) => updateForm("hubName", event.target.value)}
              placeholder="Example: Accra Central Dispatch Hub"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hub Type
            </label>

            <select
              value={form.hubType}
              onChange={(event) => updateForm("hubType", event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {hubTypes.map((hubType) => (
                <option key={hubType} value={hubType}>
                  {hubType}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Region
            </label>

            <select
              value={form.region}
              onChange={(event) => updateForm("region", event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {ghanaRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              City / Town
            </label>

            <input
              value={form.city}
              onChange={(event) => updateForm("city", event.target.value)}
              placeholder="Example: Accra, Kumasi, Tamale"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Hub Address / Landmark
          </label>

          <textarea
            value={form.address}
            onChange={(event) => updateForm("address", event.target.value)}
            placeholder="Example: Near Circle, opposite the fuel station"
            rows={3}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hub Contact Phone
            </label>

            <input
              value={form.contactPhone}
              onChange={(event) =>
                updateForm("contactPhone", event.target.value)
              }
              placeholder="Example: 0241234567"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Operating Hours
            </label>

            <input
              value={form.operatingHours}
              onChange={(event) =>
                updateForm("operatingHours", event.target.value)
              }
              placeholder="Example: Mon–Sat, 7:00am–8:00pm"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hub Manager Name
            </label>

            <input
              value={form.managerName}
              onChange={(event) =>
                updateForm("managerName", event.target.value)
              }
              placeholder="Example: Ama Owusu"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hub Manager Phone
            </label>

            <input
              value={form.managerPhone}
              onChange={(event) =>
                updateForm("managerPhone", event.target.value)
              }
              placeholder="Example: 0201234567"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Latitude
            </label>

            <input
              value={form.latitude}
              onChange={(event) =>
                updateForm("latitude", event.target.value)
              }
              placeholder="Optional map latitude"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Longitude
            </label>

            <input
              value={form.longitude}
              onChange={(event) =>
                updateForm("longitude", event.target.value)
              }
              placeholder="Optional map longitude"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Admin Note
          </label>

          <textarea
            value={form.adminNote}
            onChange={(event) =>
              updateForm("adminNote", event.target.value)
            }
            placeholder="Example: Main transfer point for Accra-to-Kumasi packages."
            rows={3}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        {editingHubId && (
          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateForm("isActive", event.target.checked)
              }
            />
            Hub is active for assignments
          </label>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
          >
            {isSaving
              ? "Saving..."
              : editingHubId
                ? "Update Hub"
                : "Create Hub"}
          </button>

          {editingHubId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-900"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3"
        >
          <option value="All">All Hubs</option>
          <option value="Active">Active Hubs</option>
          <option value="Inactive">Inactive Hubs</option>
        </select>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search hub, city, region, manager, or landmark"
          className="rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      {isLoading ? (
        <p className="mt-6 text-gray-600">Loading delivery hubs...</p>
      ) : filteredHubs.length === 0 ? (
        <p className="mt-6 text-gray-600">No delivery hubs found.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredHubs.map((hub) => (
            <div
              key={hub.id}
              className="rounded-xl border border-gray-200 p-5"
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {hub.hubType}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-gray-900">
                    {hub.hubName}
                  </h3>

                  <p className="mt-1 text-gray-600">
                    {hub.city}, {hub.region}
                  </p>

                  <p
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                      hub.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {hub.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleEdit(hub)}
                  className="h-fit rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900"
                >
                  Edit
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Hub Details</p>

                <p className="mt-2 text-sm text-gray-700">
                  Address: {hub.address || "Not provided"}
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  Contact: {hub.contactPhone || "Not provided"}
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  Manager: {hub.managerName || "Not provided"}
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  Hours: {hub.operatingHours || "Not provided"}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-blue-50 p-4">
                <p className="font-semibold text-gray-900">Map Coordinates</p>

                <p className="mt-2 text-sm text-gray-700">
                  {formatCoordinateLabel({
                    latitude: hub.latitude,
                    longitude: hub.longitude,
                  })}
                </p>
              </div>

              {hub.adminNote && (
                <p className="mt-4 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
                  {hub.adminNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}