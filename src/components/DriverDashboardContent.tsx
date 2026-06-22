"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DriverDeliveryAssignment,
  getDriverDeliveries,
  updateDriverDeliveryStatus,
} from "@/utils/driverDeliveryService";
import { formatCurrency } from "@/utils/currency";
import DeliveryMessagesPanel from "@/components/DeliveryMessagesPanel";
const driverStatuses = [
  "Pickup Started",
  "Picked Up",
  "In Transit",
  "Arrived Destination City",
  "Out for Final Delivery",
  "Delivered",
  "Failed Attempt",
];

function getStatusColor(status: string) {
  if (status === "Delivered") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Failed Attempt") {
    return "bg-red-50 text-red-700";
  }

  return "bg-blue-50 text-blue-700";
}

export default function DriverDashboardContent() {
  const [assignments, setAssignments] = useState<DriverDeliveryAssignment[]>([]);
  const [driverName, setDriverName] = useState("");
  const [driverVehicle, setDriverVehicle] = useState("");
  const [message, setMessage] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [locationNotes, setLocationNotes] = useState<Record<string, string>>({});
    const [latitudeDrafts, setLatitudeDrafts] = useState<Record<string, string>>(
    {}
  );
  const [longitudeDrafts, setLongitudeDrafts] = useState<Record<string, string>>(
    {}
  );
  const [filter, setFilter] = useState("active");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getDriverDeliveries();

      setDriverName(result.driver.fullName);
      setDriverVehicle(
        `${result.driver.vehicleType}${
          result.driver.vehicleNumber ? ` · ${result.driver.vehicleNumber}` : ""
        }`
      );
      setAssignments(result.assignments);

      const statusData: Record<string, string> = {};

      result.assignments.forEach((assignment) => {
        statusData[assignment.id] = assignment.assignmentStatus;
      });

      setStatusDrafts(statusData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load driver deliveries."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateStatusDraft(assignmentId: string, value: string) {
    setStatusDrafts((current) => ({
      ...current,
      [assignmentId]: value,
    }));
  }

  function updateLocationNote(assignmentId: string, value: string) {
    setLocationNotes((current) => ({
      ...current,
      [assignmentId]: value,
    }));
  }
  function updateLatitudeDraft(assignmentId: string, value: string) {
    setLatitudeDrafts((current) => ({
      ...current,
      [assignmentId]: value,
    }));
  }

  function updateLongitudeDraft(assignmentId: string, value: string) {
    setLongitudeDrafts((current) => ({
      ...current,
      [assignmentId]: value,
    }));
  }
  async function handleUpdateStatus(assignmentId: string) {
    try {
      const result = await updateDriverDeliveryStatus({
        assignmentId,
        assignmentStatus: statusDrafts[assignmentId] || "In Transit",
        locationNote: locationNotes[assignmentId] || "",
                latitude: latitudeDrafts[assignmentId] || "",
        longitude: longitudeDrafts[assignmentId] || "",
      });

      setMessage(result.message || "Delivery status updated.");
      updateLocationNote(assignmentId, "");
      await loadDeliveries();
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update delivery status."
      );
    }
  }

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (filter === "active") {
        return !["Delivered", "Failed Attempt"].includes(
          assignment.assignmentStatus
        );
      }

      if (filter === "completed") {
        return assignment.assignmentStatus === "Delivered";
      }

      if (filter === "failed") {
        return assignment.assignmentStatus === "Failed Attempt";
      }

      return true;
    });
  }, [assignments, filter]);

  const summary = useMemo(() => {
    return assignments.reduce(
      (totals, assignment) => {
        totals.total += 1;

        if (
          !["Delivered", "Failed Attempt"].includes(
            assignment.assignmentStatus
          )
        ) {
          totals.active += 1;
        }

        if (assignment.assignmentStatus === "Delivered") {
          totals.delivered += 1;
        }

        if (assignment.assignmentStatus === "Failed Attempt") {
          totals.failed += 1;
        }

        return totals;
      },
      {
        total: 0,
        active: 0,
        delivered: 0,
        failed: 0,
      }
    );
  }, [assignments]);

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading driver dashboard...</p>
      </div>
    );
  }

  if (message && assignments.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-red-600">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/driver/apply"
            className="rounded-lg bg-black px-6 py-3 text-center text-white"
          >
            Driver Application
          </Link>

          <Link
            href="/account"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
          >
            Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-3xl bg-black p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">
          Delivery Driver Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          {driverName || "Driver Dashboard"}
        </h1>

        <p className="mt-3 text-gray-200">
          {driverVehicle || "View assigned deliveries and update delivery status."}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-sm text-gray-300">Total Assignments</p>
            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-sm text-gray-300">Active Deliveries</p>
            <p className="mt-1 text-2xl font-bold">{summary.active}</p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-sm text-gray-300">Delivered</p>
            <p className="mt-1 text-2xl font-bold">{summary.delivered}</p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-sm text-gray-300">Failed Attempts</p>
            <p className="mt-1 text-2xl font-bold">{summary.failed}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Assigned Deliveries
            </h2>

            <p className="mt-2 text-gray-600">
              Call customers, follow route notes, and update delivery status so
              customers and admin can track progress.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDeliveries}
            className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {[
            ["active", "Active"],
            ["completed", "Delivered"],
            ["failed", "Failed"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === value
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredAssignments.length === 0 ? (
          <p className="mt-6 text-gray-600">
            No delivery assignments found for this filter.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {filteredAssignments.map((assignment) => {
              const order = assignment.order;

              return (
                <div
                  key={assignment.id}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                            {assignment.assignmentType}
                          </p>

                          <h3 className="mt-1 text-xl font-bold text-gray-900">
                            Order {assignment.orderId}
                          </h3>

                          <p className="mt-1 text-gray-600">
                            Assigned: {assignment.assignedAt}
                          </p>
                        </div>

                        <span
                          className={`h-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                            assignment.assignmentStatus
                          )}`}
                        >
                          {assignment.assignmentStatus}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="font-semibold text-gray-900">
                            Pickup / Route
                          </p>

                          <p className="mt-2 text-gray-600">
                            Pickup: {assignment.pickupCity || "Not specified"},{" "}
                            {assignment.pickupRegion}
                          </p>

                          <p className="mt-1 text-gray-600">
                            Drop-off:{" "}
                            {assignment.dropoffCity ||
                              order?.deliveryCity ||
                              "Not specified"}
                            ,{" "}
                            {assignment.dropoffRegion ||
                              order?.deliveryRegion ||
                              ""}
                          </p>

                          {assignment.routeNote && (
                            <p className="mt-2 text-sm text-gray-600">
                              Route note: {assignment.routeNote}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-yellow-50 p-4">
                          <p className="font-semibold text-gray-900">
                            Payment / Escrow
                          </p>

                          <p className="mt-2 text-gray-700">
                            Payment: {order?.paymentStatus || "Pending"}
                          </p>

                          <p className="mt-1 text-gray-700">
                            Escrow: {order?.escrowStatus || "Held"}
                          </p>

                          <p className="mt-1 text-gray-700">
                            Delivery Fee:{" "}
                            {formatCurrency(order?.deliveryFee || 0)}
                          </p>
                        </div>
                      </div>

                      {assignment.adminNote && (
                        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-blue-800">
                          Admin note: {assignment.adminNote}
                        </div>
                      )}
                    </div>

                    {order && (
                      <div className="rounded-xl bg-gray-50 p-5">
                        <p className="font-semibold text-gray-900">
                          Customer Delivery Details
                        </p>

                        <p className="mt-3 text-gray-700">
                          Customer: {order.customerName}
                        </p>

                        <p className="mt-1 text-gray-700">
                          Phone: {order.deliveryPhone}
                        </p>

                        <p className="mt-1 text-gray-700">
                          City: {order.deliveryCity}, {order.deliveryRegion}
                        </p>

                        <p className="mt-1 text-gray-700">
                          Address: {order.shippingAddress}
                        </p>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          {order.deliveryPhone && (
                            <a
                              href={`tel:${order.deliveryPhone}`}
                              className="rounded-lg bg-black px-5 py-2 text-center text-sm font-semibold text-white"
                            >
                              Call Customer
                            </a>
                          )}

                          <Link
                            href={`/orders/${assignment.orderId}/tracking`}
                            className="rounded-lg border border-blue-300 px-5 py-2 text-center text-sm font-semibold text-blue-700"
                          >
                            View Tracking
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
<DeliveryMessagesPanel
  orderId={assignment.orderId}
  viewerRole="driver"
/>
                  <div className="mt-5 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                    <p className="font-semibold text-gray-900">
                      Update Delivery Progress
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <select
                        value={
                          statusDrafts[assignment.id] ||
                          assignment.assignmentStatus
                        }
                        onChange={(event) =>
                          updateStatusDraft(assignment.id, event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-4 py-3"
                      >
                        {driverStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <input
                        value={locationNotes[assignment.id] || ""}
                        onChange={(event) =>
                          updateLocationNote(assignment.id, event.target.value)
                        }
                        placeholder="Location note, e.g. picked up from Madina seller"
                        className="rounded-lg border border-gray-300 px-4 py-3"
                      />
<input
  value={latitudeDrafts[assignment.id] || ""}
  onChange={(event) =>
    updateLatitudeDraft(assignment.id, event.target.value)
  }
  placeholder="Current latitude"
  className="rounded-lg border border-gray-300 px-4 py-3"
/>

<input
  value={longitudeDrafts[assignment.id] || ""}
  onChange={(event) =>
    updateLongitudeDraft(assignment.id, event.target.value)
  }
  placeholder="Current longitude"
  className="rounded-lg border border-gray-300 px-4 py-3"
/>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(assignment.id)}
                        className="rounded-lg bg-black px-5 py-3 text-white"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}