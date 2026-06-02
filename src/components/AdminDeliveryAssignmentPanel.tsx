"use client";

import { useEffect, useMemo, useState } from "react";
import { DeliveryAssignment, DeliveryDriverProfile, Order } from "@/types/models";
import { getAdminDatabaseOrders } from "@/utils/databaseOrderService";
import {
  createDeliveryAssignment,
  getAdminDeliveryAssignmentData,
  updateDeliveryAssignmentStatus,
} from "@/utils/adminDeliveryAssignmentService";

const assignmentTypes = [
  "Seller Pickup",
  "Intra-city",
  "Inter-city",
  "Final Mile",
];

const assignmentStatuses = [
  "Assigned",
  "Pickup Started",
  "Picked Up",
  "In Transit",
  "Arrived Destination City",
  "Out for Final Delivery",
  "Delivered",
  "Failed Attempt",
];

type AssignmentDraft = {
  driverId: string;
  assignmentType: string;
  pickupRegion: string;
  pickupCity: string;
  dropoffRegion: string;
  dropoffCity: string;
  routeNote: string;
  adminNote: string;
};

export default function AdminDeliveryAssignmentPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriverProfile[]>([]);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [message, setMessage] = useState("");
  const [orderFilter, setOrderFilter] = useState("ready");
  const [drafts, setDrafts] = useState<Record<string, AssignmentDraft>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [locationNotes, setLocationNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPanelData();
  }, []);

  async function loadPanelData() {
    try {
      setIsLoading(true);
      setMessage("");

      const [databaseOrders, assignmentData] = await Promise.all([
        getAdminDatabaseOrders(),
        getAdminDeliveryAssignmentData(),
      ]);

      setOrders(databaseOrders);
      setDrivers(assignmentData.drivers);
      setAssignments(assignmentData.assignments);

      const draftData: Record<string, AssignmentDraft> = {};
      const statusData: Record<string, string> = {};

      databaseOrders.forEach((order) => {
        draftData[order.id] = {
          driverId: "",
          assignmentType: "Final Mile",
          pickupRegion: "",
          pickupCity: "",
          dropoffRegion: order.delivery?.region || "",
          dropoffCity: order.delivery?.city || "",
          routeNote: "",
          adminNote: "",
        };
      });

      assignmentData.assignments.forEach((assignment) => {
        statusData[assignment.id] = assignment.assignmentStatus;
      });

      setDrafts(draftData);
      setStatusDrafts(statusData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery assignment panel."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateDraft(orderId: string, field: keyof AssignmentDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value,
      },
    }));
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

  function getOrderAssignments(orderId: string) {
    return assignments.filter((assignment) => assignment.orderId === orderId);
  }

  function isOrderReadyForAssignment(order: Order) {
    const sellerItems = order.items.filter(
      (item) => item.sellerId || item.sellerBusinessName
    );

    if (sellerItems.length === 0) {
      return true;
    }

    return sellerItems.every(
      (item) => item.sellerFulfillmentStatus === "Ready for Pickup"
    );
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const ready = isOrderReadyForAssignment(order);
      const hasAssignment = getOrderAssignments(order.id).length > 0;

      if (orderFilter === "ready") {
        return ready && !hasAssignment && order.status !== "Delivered";
      }

      if (orderFilter === "assigned") {
        return hasAssignment && order.status !== "Delivered";
      }

      if (orderFilter === "pending-seller") {
        return !ready && order.status !== "Delivered";
      }

      return true;
    });
  }, [orders, assignments, orderFilter]);

  async function handleCreateAssignment(order: Order) {
    const draft = drafts[order.id];

    if (!draft?.driverId) {
      setMessage("Please select a verified driver.");
      return;
    }

    try {
      const result = await createDeliveryAssignment({
        orderId: order.id,
        driverId: draft.driverId,
        assignmentType: draft.assignmentType,
        pickupRegion: draft.pickupRegion,
        pickupCity: draft.pickupCity,
        dropoffRegion: draft.dropoffRegion,
        dropoffCity: draft.dropoffCity,
        routeNote: draft.routeNote,
        adminNote: draft.adminNote,
      });

      setMessage(result.message || "Delivery assignment created.");
      await loadPanelData();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to assign delivery driver."
      );
    }
  }

  async function handleUpdateAssignment(assignmentId: string) {
    try {
      const result = await updateDeliveryAssignmentStatus({
        assignmentId,
        assignmentStatus: statusDrafts[assignmentId] || "Assigned",
        locationNote: locationNotes[assignmentId] || "",
      });

      setMessage(result.message || "Delivery assignment updated.");
      await loadPanelData();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update delivery assignment."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Delivery Assignment
        </h2>
        <p className="mt-4 text-gray-600">Loading delivery assignments...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Assignment
          </h2>

          <p className="mt-2 text-gray-600">
            Assign verified drivers to ready orders. Use route coverage to match
            intra-city, inter-city, and final-mile deliveries.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPanelData}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          ["ready", "Ready / Unassigned"],
          ["assigned", "Assigned"],
          ["pending-seller", "Pending Seller"],
          ["all", "All Orders"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setOrderFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              orderFilter === value
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {drivers.length === 0 && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          No verified delivery drivers available. Verify drivers in the Delivery
          Driver Registry before assigning deliveries.
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <p className="mt-6 text-gray-600">
          No orders match this assignment filter.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {filteredOrders.map((order) => {
            const draft = drafts[order.id];
            const orderAssignments = getOrderAssignments(order.id);
            const ready = isOrderReadyForAssignment(order);

            return (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 p-5"
              >
                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Order {order.id}
                    </h3>

                    <p className="mt-1 text-gray-600">{order.createdAt}</p>

                    <p className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                      Status: {order.status}
                    </p>

                    <div
                      className={`mt-4 rounded-xl p-4 ${
                        ready ? "bg-green-50" : "bg-orange-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">
                        Assignment Readiness
                      </p>

                      <p className="mt-2 text-sm text-gray-700">
                        {ready
                          ? "This order is ready for driver assignment."
                          : "Seller items are not fully ready yet."}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        Customer Delivery
                      </p>

                      <p className="mt-2 text-gray-600">
                        {order.customer.fullName}
                      </p>

                      <p className="mt-1 text-gray-600">
                        {order.delivery?.city}, {order.delivery?.region}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Phone: {order.delivery?.phone}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Address: {order.customer.shippingAddress}
                      </p>
                    </div>

                    {orderAssignments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {orderAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="rounded-xl bg-blue-50 p-4"
                          >
                            <p className="font-semibold text-gray-900">
                              Assigned Driver: {assignment.driverName}
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              Type: {assignment.assignmentType}
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              Status: {assignment.assignmentStatus}
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              Phone:{" "}
                              {assignment.driverPlatformPhone ||
                                assignment.driverPhone}
                            </p>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <select
                                value={
                                  statusDrafts[assignment.id] ||
                                  assignment.assignmentStatus
                                }
                                onChange={(event) =>
                                  updateStatusDraft(
                                    assignment.id,
                                    event.target.value
                                  )
                                }
                                className="rounded-lg border border-blue-200 px-4 py-3"
                              >
                                {assignmentStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>

                              <input
                                value={locationNotes[assignment.id] || ""}
                                onChange={(event) =>
                                  updateLocationNote(
                                    assignment.id,
                                    event.target.value
                                  )
                                }
                                placeholder="Location note, e.g. package reached Asafo"
                                className="rounded-lg border border-blue-200 px-4 py-3"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAssignment(assignment.id)
                              }
                              className="mt-3 rounded-lg bg-black px-5 py-2 text-white"
                            >
                              Update Delivery Status
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {draft && (
                    <div className="rounded-xl bg-gray-50 p-5">
                      <p className="font-semibold text-gray-900">
                        Assign New Driver
                      </p>

                      <div className="mt-4 space-y-4">
                        <select
                          value={draft.driverId}
                          onChange={(event) =>
                            updateDraft(order.id, "driverId", event.target.value)
                          }
                          disabled={!ready || drivers.length === 0}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                        >
                          <option value="">Select verified driver</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.fullName} · {driver.city} ·{" "}
                              {driver.vehicleType}
                            </option>
                          ))}
                        </select>

                        <select
                          value={draft.assignmentType}
                          onChange={(event) =>
                            updateDraft(
                              order.id,
                              "assignmentType",
                              event.target.value
                            )
                          }
                          disabled={!ready}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                        >
                          {assignmentTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>

                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            value={draft.pickupCity}
                            onChange={(event) =>
                              updateDraft(order.id, "pickupCity", event.target.value)
                            }
                            placeholder="Pickup city"
                            disabled={!ready}
                            className="rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                          />

                          <input
                            value={draft.dropoffCity}
                            onChange={(event) =>
                              updateDraft(order.id, "dropoffCity", event.target.value)
                            }
                            placeholder="Drop-off city"
                            disabled={!ready}
                            className="rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                          />
                        </div>

                        <textarea
                          value={draft.routeNote}
                          onChange={(event) =>
                            updateDraft(order.id, "routeNote", event.target.value)
                          }
                          placeholder="Route note, e.g. Accra East pickup, final delivery at East Legon."
                          rows={3}
                          disabled={!ready}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                        />

                        <textarea
                          value={draft.adminNote}
                          onChange={(event) =>
                            updateDraft(order.id, "adminNote", event.target.value)
                          }
                          placeholder="Admin note for driver/customer delivery context."
                          rows={3}
                          disabled={!ready}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                        />

                        <button
                          type="button"
                          onClick={() => handleCreateAssignment(order)}
                          disabled={!ready || drivers.length === 0}
                          className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-300 disabled:text-gray-500"
                        >
                          Assign Driver
                        </button>

                        {!ready && (
                          <p className="text-sm text-orange-700">
                            Driver assignment is disabled until seller items are
                            ready for pickup.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}