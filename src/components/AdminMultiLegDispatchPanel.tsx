"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DeliveryAssignment,
  DeliveryDriverProfile,
  DeliveryHub,
  Order,
} from "@/types/models";
import { getAdminDatabaseOrders } from "@/utils/databaseOrderService";
import { buildDriverMatchSuggestions } from "@/utils/deliveryRouteMatching";
import {
  createMultiLegDeliveryLeg,
  getMultiLegDispatchData,
  recordDeliveryHubHandover,
} from "@/utils/adminMultiLegDispatchService";

type DispatchDraft = {
  driverId: string;
  assignmentType: string;
  originHubId: string;
  destinationHubId: string;
  pickupRegion: string;
  pickupCity: string;
  dropoffRegion: string;
  dropoffCity: string;
  routeNote: string;
  adminNote: string;
};

type HandoverDraft = {
  hubId: string;
  toAssignmentId: string;
  eventType: string;
  eventNote: string;
};

const assignmentTypes = [
  "Seller Pickup",
  "Intra-city",
  "Inter-city",
  "Final Mile",
];

const handoverEventTypes = [
  "Arrived at Hub",
  "Received at Hub",
  "Handed Over to Next Driver",
  "Departed Hub",
];

function emptyDispatchDraft(order?: Order): DispatchDraft {
  return {
    driverId: "",
    assignmentType: "Seller Pickup",
    originHubId: "",
    destinationHubId: "",
    pickupRegion: "",
    pickupCity: "",
    dropoffRegion: order?.delivery?.region || "",
    dropoffCity: order?.delivery?.city || "",
    routeNote: "",
    adminNote: "",
  };
}

export default function AdminMultiLegDispatchPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriverProfile[]>([]);
  const [hubs, setHubs] = useState<DeliveryHub[]>([]);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [dispatchDraft, setDispatchDraft] = useState<DispatchDraft>(
    emptyDispatchDraft()
  );
  const [handoverDrafts, setHandoverDrafts] = useState<
    Record<string, HandoverDraft>
  >({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLeg, setIsSavingLeg] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setMessage("");

      const [databaseOrders, dispatchData] = await Promise.all([
        getAdminDatabaseOrders(),
        getMultiLegDispatchData(),
      ]);

      setOrders(databaseOrders);
      setDrivers(dispatchData.drivers);
      setHubs(dispatchData.hubs);
      setAssignments(dispatchData.assignments);

      if (!selectedOrderId && databaseOrders.length > 0) {
        setSelectedOrderId(databaseOrders[0].id);
        setDispatchDraft(emptyDispatchDraft(databaseOrders[0]));
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load multi-leg dispatch data."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const orderLegs = useMemo(() => {
    if (!selectedOrderId) {
      return [];
    }

    return assignments
      .filter((assignment) => assignment.orderId === selectedOrderId)
      .sort(
        (first, second) =>
          (first.legSequence || 1) - (second.legSequence || 1)
      );
  }, [assignments, selectedOrderId]);

  const nextLegNumber = orderLegs.length + 1;

  const driverSuggestions = useMemo(() => {
    if (!selectedOrder) {
      return [];
    }

    return buildDriverMatchSuggestions({
      order: selectedOrder,
      drivers,
      assignmentType: dispatchDraft.assignmentType,
      pickupCity: dispatchDraft.pickupCity,
      pickupRegion: dispatchDraft.pickupRegion,
      dropoffCity: dispatchDraft.dropoffCity,
      dropoffRegion: dispatchDraft.dropoffRegion,
    });
  }, [selectedOrder, drivers, dispatchDraft]);

  function updateDispatchDraft<K extends keyof DispatchDraft>(
    field: K,
    value: DispatchDraft[K]
  ) {
    setDispatchDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateHandoverDraft(
    assignmentId: string,
    field: keyof HandoverDraft,
    value: string,
    assignment: DeliveryAssignment
  ) {
    setHandoverDrafts((current) => ({
      ...current,
      [assignmentId]: {
        hubId:
          current[assignmentId]?.hubId ||
          assignment.destinationHubId ||
          assignment.originHubId ||
          "",
        toAssignmentId: current[assignmentId]?.toAssignmentId || "",
        eventType:
          current[assignmentId]?.eventType || "Arrived at Hub",
        eventNote: current[assignmentId]?.eventNote || "",
        [field]: value,
      },
    }));
  }

  function selectOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId);

    setSelectedOrderId(orderId);
    setDispatchDraft(emptyDispatchDraft(order));
  }

  async function handleCreateLeg() {
    if (!selectedOrder) {
      setMessage("Select an order before creating a delivery leg.");
      return;
    }

    if (!dispatchDraft.driverId) {
      setMessage("Select a verified delivery driver.");
      return;
    }

    try {
      setIsSavingLeg(true);
      setMessage("");

      const result = await createMultiLegDeliveryLeg({
        orderId: selectedOrder.id,
        driverId: dispatchDraft.driverId,
        assignmentType: dispatchDraft.assignmentType,
        originHubId: dispatchDraft.originHubId,
        destinationHubId: dispatchDraft.destinationHubId,
        pickupRegion: dispatchDraft.pickupRegion,
        pickupCity: dispatchDraft.pickupCity,
        dropoffRegion: dispatchDraft.dropoffRegion,
        dropoffCity: dispatchDraft.dropoffCity,
        routeNote: dispatchDraft.routeNote,
        adminNote: dispatchDraft.adminNote,
      });

      setMessage(result.message || "Delivery leg created.");
      setDispatchDraft(emptyDispatchDraft(selectedOrder));
      await loadData();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create delivery leg."
      );
    } finally {
      setIsSavingLeg(false);
    }
  }

  async function handleRecordHandover(assignment: DeliveryAssignment) {
    const draft = handoverDrafts[assignment.id] || {
      hubId: assignment.destinationHubId || assignment.originHubId || "",
      toAssignmentId: "",
      eventType: "Arrived at Hub",
      eventNote: "",
    };

    if (!draft.hubId) {
      setMessage("Select the hub where this event happened.");
      return;
    }

    try {
      setMessage("");

      const result = await recordDeliveryHubHandover({
        fromAssignmentId: assignment.id,
        toAssignmentId: draft.toAssignmentId,
        hubId: draft.hubId,
        eventType: draft.eventType,
        eventNote: draft.eventNote,
      });

      setMessage(result.message || "Hub event recorded.");
      await loadData();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to record hub handover."
      );
    }
  }

  if (isLoading) {
    return (
      <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Multi-Leg Hub Dispatch
        </h2>
        <p className="mt-4 text-gray-600">Loading dispatch workspace...</p>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Multi-Leg Hub Dispatch
          </h2>

          <p className="mt-2 max-w-3xl text-gray-600">
            Build seller pickup, inter-city transfer, and final-mile delivery
            legs for orders moving through Ghana Marketplace hubs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Dispatch Data
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl bg-gray-50 p-5 text-gray-700">
          There are no orders yet. Create one clean test order before testing
          hub dispatch.
        </div>
      ) : (
        <>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Select Order for Multi-Leg Dispatch
            </label>

            <select
              value={selectedOrderId}
              onChange={(event) => selectOrder(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id.slice(0, 8)} · {order.customer.fullName} ·{" "}
                  {order.delivery?.city || "No city"} · {order.status}
                </option>
              ))}
            </select>
          </div>

          {selectedOrder && (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Order Dispatch Plan
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-gray-900">
                    Order {selectedOrder.id}
                  </h3>

                  <p className="mt-2 text-gray-700">
                    Customer: {selectedOrder.customer.fullName}
                  </p>

                  <p className="mt-1 text-gray-700">
                    Final delivery: {selectedOrder.delivery?.city},{" "}
                    {selectedOrder.delivery?.region}
                  </p>

                  <p className="mt-1 text-gray-700">
                    Address: {selectedOrder.customer.shippingAddress}
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      Existing Delivery Legs
                    </h3>

                    <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white">
                      {orderLegs.length} leg{orderLegs.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {orderLegs.length === 0 ? (
                    <p className="mt-4 text-gray-600">
                      No legs created yet. Start with seller pickup or direct
                      final-mile delivery.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-5">
                      {orderLegs.map((assignment) => {
                        const handoverDraft = handoverDrafts[assignment.id] || {
                          hubId:
                            assignment.destinationHubId ||
                            assignment.originHubId ||
                            "",
                          toAssignmentId: "",
                          eventType: "Arrived at Hub",
                          eventNote: "",
                        };

                        const laterLegs = orderLegs.filter(
                          (item) =>
                            (item.legSequence || 1) >
                            (assignment.legSequence || 1)
                        );

                        return (
                          <div
                            key={assignment.id}
                            className="rounded-xl bg-gray-50 p-4"
                          >
                            <div className="flex flex-col justify-between gap-3 md:flex-row">
                              <div>
                                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                                  Leg {assignment.legSequence || 1} ·{" "}
                                  {assignment.assignmentType}
                                </p>

                                <p className="mt-1 text-lg font-bold text-gray-900">
                                  {assignment.driverName || "Assigned Driver"}
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                  {assignment.driverVehicleType}
                                  {assignment.driverVehicleNumber
                                    ? ` · ${assignment.driverVehicleNumber}`
                                    : ""}
                                </p>
                              </div>

                              <div className="text-left md:text-right">
                                <p className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                  {assignment.assignmentStatus}
                                </p>

                                <p className="mt-2 text-sm text-gray-600">
                                  Handover: {assignment.handoverStatus}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-lg bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Origin Hub
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {assignment.originHubName || "Direct pickup"}
                                </p>
                              </div>

                              <div className="rounded-lg bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Destination Hub
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {assignment.destinationHubName ||
                                    "Direct customer delivery"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 rounded-lg bg-white p-4">
                              <p className="font-semibold text-gray-900">
                                Record Hub Event
                              </p>

                              <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <select
                                  value={handoverDraft.hubId}
                                  onChange={(event) =>
                                    updateHandoverDraft(
                                      assignment.id,
                                      "hubId",
                                      event.target.value,
                                      assignment
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 px-4 py-3"
                                >
                                  <option value="">Select hub</option>
                                  {hubs.map((hub) => (
                                    <option key={hub.id} value={hub.id}>
                                      {hub.hubName} · {hub.city}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={handoverDraft.eventType}
                                  onChange={(event) =>
                                    updateHandoverDraft(
                                      assignment.id,
                                      "eventType",
                                      event.target.value,
                                      assignment
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 px-4 py-3"
                                >
                                  {handoverEventTypes.map((eventType) => (
                                    <option key={eventType} value={eventType}>
                                      {eventType}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={handoverDraft.toAssignmentId}
                                  onChange={(event) =>
                                    updateHandoverDraft(
                                      assignment.id,
                                      "toAssignmentId",
                                      event.target.value,
                                      assignment
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 px-4 py-3"
                                >
                                  <option value="">
                                    No next leg selected
                                  </option>

                                  {laterLegs.map((laterLeg) => (
                                    <option
                                      key={laterLeg.id}
                                      value={laterLeg.id}
                                    >
                                      Leg {laterLeg.legSequence} ·{" "}
                                      {laterLeg.assignmentType} ·{" "}
                                      {laterLeg.driverName}
                                    </option>
                                  ))}
                                </select>

                                <input
                                  value={handoverDraft.eventNote}
                                  onChange={(event) =>
                                    updateHandoverDraft(
                                      assignment.id,
                                      "eventNote",
                                      event.target.value,
                                      assignment
                                    )
                                  }
                                  placeholder="Optional handover note"
                                  className="rounded-lg border border-gray-300 px-4 py-3"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleRecordHandover(assignment)
                                }
                                className="mt-3 rounded-lg bg-black px-5 py-2 text-white"
                              >
                                Save Hub Event
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Create Delivery Leg
                </p>

                <h3 className="mt-2 text-xl font-bold text-gray-900">
                  Leg {nextLegNumber}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Add the next driver movement in the order’s delivery chain.
                </p>

                <div className="mt-5 space-y-4">
                  <select
                    value={dispatchDraft.assignmentType}
                    onChange={(event) =>
                      updateDispatchDraft(
                        "assignmentType",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  >
                    {assignmentTypes.map((assignmentType) => (
                      <option key={assignmentType} value={assignmentType}>
                        {assignmentType}
                      </option>
                    ))}
                  </select>

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="font-semibold text-gray-900">
                      Recommended Drivers
                    </p>

                    <div className="mt-3 space-y-3">
                      {driverSuggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion.driver.id}
                          type="button"
                          onClick={() =>
                            updateDispatchDraft(
                              "driverId",
                              suggestion.driver.id
                            )
                          }
                          className={`w-full rounded-lg border p-3 text-left ${
                            dispatchDraft.driverId === suggestion.driver.id
                              ? "border-black bg-white"
                              : "border-blue-100 bg-white"
                          }`}
                        >
                          <div className="flex justify-between gap-3">
                            <p className="font-semibold text-gray-900">
                              {suggestion.driver.fullName}
                            </p>

                            <span className="text-sm font-semibold text-blue-700">
                              {suggestion.score}% · {suggestion.matchLabel}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-600">
                            {suggestion.driver.city}, {suggestion.driver.region}{" "}
                            · {suggestion.driver.vehicleType}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <select
                    value={dispatchDraft.driverId}
                    onChange={(event) =>
                      updateDispatchDraft("driverId", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  >
                    <option value="">Select verified driver</option>

                    {driverSuggestions.map((suggestion) => (
                      <option
                        key={suggestion.driver.id}
                        value={suggestion.driver.id}
                      >
                        {suggestion.score}% · {suggestion.driver.fullName} ·{" "}
                        {suggestion.driver.city} ·{" "}
                        {suggestion.driver.vehicleType}
                      </option>
                    ))}
                  </select>

                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={dispatchDraft.originHubId}
                      onChange={(event) =>
                        updateDispatchDraft("originHubId", event.target.value)
                      }
                      className="rounded-lg border border-gray-300 px-4 py-3"
                    >
                      <option value="">No origin hub</option>

                      {hubs.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.hubName} · {hub.city}
                        </option>
                      ))}
                    </select>

                    <select
                      value={dispatchDraft.destinationHubId}
                      onChange={(event) =>
                        updateDispatchDraft(
                          "destinationHubId",
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-gray-300 px-4 py-3"
                    >
                      <option value="">No destination hub</option>

                      {hubs.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.hubName} · {hub.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={dispatchDraft.pickupCity}
                      onChange={(event) =>
                        updateDispatchDraft("pickupCity", event.target.value)
                      }
                      placeholder="Pickup city"
                      className="rounded-lg border border-gray-300 px-4 py-3"
                    />

                    <input
                      value={dispatchDraft.dropoffCity}
                      onChange={(event) =>
                        updateDispatchDraft("dropoffCity", event.target.value)
                      }
                      placeholder="Drop-off city"
                      className="rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={dispatchDraft.pickupRegion}
                      onChange={(event) =>
                        updateDispatchDraft("pickupRegion", event.target.value)
                      }
                      placeholder="Pickup region"
                      className="rounded-lg border border-gray-300 px-4 py-3"
                    />

                    <input
                      value={dispatchDraft.dropoffRegion}
                      onChange={(event) =>
                        updateDispatchDraft(
                          "dropoffRegion",
                          event.target.value
                        )
                      }
                      placeholder="Drop-off region"
                      className="rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <textarea
                    value={dispatchDraft.routeNote}
                    onChange={(event) =>
                      updateDispatchDraft("routeNote", event.target.value)
                    }
                    placeholder="Route note, pickup timing, or driver instruction"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />

                  <textarea
                    value={dispatchDraft.adminNote}
                    onChange={(event) =>
                      updateDispatchDraft("adminNote", event.target.value)
                    }
                    placeholder="Internal admin note for this leg"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />

                  <button
                    type="button"
                    disabled={isSavingLeg || !dispatchDraft.driverId}
                    onClick={() => void handleCreateLeg()}
                    className="w-full rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
                  >
                    {isSavingLeg
                      ? "Creating Delivery Leg..."
                      : `Create Leg ${nextLegNumber}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}