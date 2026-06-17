"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DeliveryRoute } from "@/types/models";
import { ghanaRegions } from "@/utils/ghanaDelivery";
import { formatCurrency } from "@/utils/currency";
import {
  createAdminDeliveryRoute,
  getAdminDeliveryRoutes,
  updateAdminDeliveryRoute,
} from "@/utils/adminDeliveryRouteService";

const routeTypes = ["Intra-city", "Inter-city", "Seller Pickup", "Final Mile"];

function emptyForm() {
  return {
    routeName: "",
    routeType: "Intra-city",
    originRegion: "Greater Accra",
    originCity: "",
    destinationRegion: "Greater Accra",
    destinationCity: "",
    routeZones: "",
    estimatedDeliveryFee: "0",
    estimatedTransitTime: "",
    adminNote: "",
    isActive: true,
  };
}

export default function AdminDeliveryRouteManager() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editingRouteId, setEditingRouteId] = useState("");
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getAdminDeliveryRoutes();

      setRoutes(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery routes."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateForm(field: keyof ReturnType<typeof emptyForm>, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingRouteId("");
  }

  function handleEdit(route: DeliveryRoute) {
    setEditingRouteId(route.id);
    setForm({
      routeName: route.routeName,
      routeType: route.routeType,
      originRegion: route.originRegion || "Greater Accra",
      originCity: route.originCity || "",
      destinationRegion: route.destinationRegion || "Greater Accra",
      destinationCity: route.destinationCity || "",
      routeZones: route.routeZones || "",
      estimatedDeliveryFee: String(route.estimatedDeliveryFee || 0),
      estimatedTransitTime: route.estimatedTransitTime || "",
      adminNote: route.adminNote || "",
      isActive: route.isActive,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setMessage("");

      const payload = {
        routeName: form.routeName.trim(),
        routeType: form.routeType,
        originRegion: form.originRegion,
        originCity: form.originCity.trim(),
        destinationRegion: form.destinationRegion,
        destinationCity: form.destinationCity.trim(),
        routeZones: form.routeZones.trim(),
        estimatedDeliveryFee: Number(form.estimatedDeliveryFee || 0),
        estimatedTransitTime: form.estimatedTransitTime.trim(),
        adminNote: form.adminNote.trim(),
      };

      if (!payload.routeName || !payload.routeType) {
        setMessage("Route name and route type are required.");
        return;
      }

      const result = editingRouteId
        ? await updateAdminDeliveryRoute({
            routeId: editingRouteId,
            ...payload,
            isActive: form.isActive,
          })
        : await createAdminDeliveryRoute(payload);

      setMessage(result.message || "Delivery route saved.");
      resetForm();
      await loadRoutes();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save delivery route."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const summary = useMemo(() => {
    return routes.reduce(
      (totals, route) => {
        totals.total += 1;

        if (route.isActive) {
          totals.active += 1;
        }

        if (route.routeType === "Intra-city") {
          totals.intraCity += 1;
        }

        if (route.routeType === "Inter-city") {
          totals.interCity += 1;
        }

        return totals;
      },
      {
        total: 0,
        active: 0,
        intraCity: 0,
        interCity: 0,
      }
    );
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return routes.filter((route) => {
      const matchesFilter = filter === "All" || route.routeType === filter;

      const searchableText = [
        route.routeName,
        route.routeType,
        route.originRegion || "",
        route.originCity || "",
        route.destinationRegion || "",
        route.destinationCity || "",
        route.routeZones || "",
        route.adminNote || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [routes, filter, searchTerm]);

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Route Management
          </h2>

          <p className="mt-2 text-gray-600">
            Define Ghana delivery corridors, intra-city zones, inter-city routes,
            estimated delivery fees, and route notes for dispatch planning.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRoutes}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Routes
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total Routes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summary.total}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm text-green-700">Active Routes</p>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {summary.active}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Intra-city Routes</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {summary.intraCity}
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-sm text-purple-700">Inter-city Routes</p>
          <p className="mt-1 text-2xl font-bold text-purple-900">
            {summary.interCity}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl bg-gray-50 p-5"
      >
        <h3 className="text-lg font-bold text-gray-900">
          {editingRouteId ? "Edit Delivery Route" : "Create Delivery Route"}
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Route Name
            </label>

            <input
              value={form.routeName}
              onChange={(event) => updateForm("routeName", event.target.value)}
              placeholder="Example: Accra to Kumasi"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Route Type
            </label>

            <select
              value={form.routeType}
              onChange={(event) => updateForm("routeType", event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {routeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4">
            <p className="font-semibold text-gray-900">Origin</p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select
                value={form.originRegion}
                onChange={(event) =>
                  updateForm("originRegion", event.target.value)
                }
                className="rounded-lg border border-gray-300 px-4 py-3"
              >
                {ghanaRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <input
                value={form.originCity}
                onChange={(event) =>
                  updateForm("originCity", event.target.value)
                }
                placeholder="Origin city"
                className="rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-4">
            <p className="font-semibold text-gray-900">Destination</p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select
                value={form.destinationRegion}
                onChange={(event) =>
                  updateForm("destinationRegion", event.target.value)
                }
                className="rounded-lg border border-gray-300 px-4 py-3"
              >
                {ghanaRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <input
                value={form.destinationCity}
                onChange={(event) =>
                  updateForm("destinationCity", event.target.value)
                }
                placeholder="Destination city"
                className="rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Route Zones / Towns Covered
          </label>

          <textarea
            value={form.routeZones}
            onChange={(event) => updateForm("routeZones", event.target.value)}
            placeholder="Example: Circle, Achimota, Nsawam, Suhum, Nkawkaw, Ejisu, Asafo"
            rows={4}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estimated Delivery Fee
            </label>

            <input
              type="number"
              value={form.estimatedDeliveryFee}
              onChange={(event) =>
                updateForm("estimatedDeliveryFee", event.target.value)
              }
              placeholder="Example: 35"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estimated Transit Time
            </label>

            <input
              value={form.estimatedTransitTime}
              onChange={(event) =>
                updateForm("estimatedTransitTime", event.target.value)
              }
              placeholder="Example: Same day, 24 hours, 2–3 days"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Admin Route Note
          </label>

          <textarea
            value={form.adminNote}
            onChange={(event) => updateForm("adminNote", event.target.value)}
            placeholder="Example: Use this route for Accra sellers shipping to Kumasi customers."
            rows={3}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        {editingRouteId && (
          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
            />
            Route is active
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
              : editingRouteId
                ? "Update Route"
                : "Create Route"}
          </button>

          {editingRouteId && (
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
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3"
        >
          <option value="All">All Route Types</option>
          {routeTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search route, city, region, or zone"
          className="rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      {isLoading ? (
        <p className="mt-6 text-gray-600">Loading delivery routes...</p>
      ) : filteredRoutes.length === 0 ? (
        <p className="mt-6 text-gray-600">No delivery routes found.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              className="rounded-xl border border-gray-200 p-5"
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {route.routeType}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-gray-900">
                    {route.routeName}
                  </h3>

                  <p
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                      route.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {route.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleEdit(route)}
                  className="h-fit rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900"
                >
                  Edit
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Route Direction</p>

                <p className="mt-2 text-gray-600">
                  From: {route.originCity || "Not specified"},{" "}
                  {route.originRegion || ""}
                </p>

                <p className="mt-1 text-gray-600">
                  To: {route.destinationCity || "Not specified"},{" "}
                  {route.destinationRegion || ""}
                </p>
              </div>

              {route.routeZones && (
                <div className="mt-4 rounded-xl bg-blue-50 p-4">
                  <p className="font-semibold text-gray-900">
                    Zones / Towns Covered
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-gray-700">
                    {route.routeZones}
                  </p>
                </div>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-700">Estimated Fee</p>
                  <p className="mt-1 font-bold text-yellow-900">
                    {formatCurrency(route.estimatedDeliveryFee || 0)}
                  </p>
                </div>

                <div className="rounded-xl bg-purple-50 p-4">
                  <p className="text-sm text-purple-700">Transit Time</p>
                  <p className="mt-1 font-bold text-purple-900">
                    {route.estimatedTransitTime || "Not specified"}
                  </p>
                </div>
              </div>

              {route.adminNote && (
                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                  {route.adminNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}