"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DeliveryAssignment,
  DeliveryTrackingEvent,
} from "@/types/models";
import {
  CustomerDeliveryTrackingOrder,
  getCustomerDeliveryTracking,
} from "@/utils/customerDeliveryTrackingService";
import DeliveryMessagesPanel from "@/components/DeliveryMessagesPanel";
type DeliveryTrackingContentProps = {
  orderId: string;
};
import SimpleDeliveryMap from "@/components/SimpleDeliveryMap";
function getStatusColor(status: string) {
  if (["Delivered"].includes(status)) {
    return "bg-green-50 text-green-700";
  }

  if (
    [
      "Assigned",
      "Pickup Started",
      "Picked Up",
      "In Transit",
      "Arrived Destination City",
      "Out for Final Delivery",
    ].includes(status)
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (["Failed Attempt"].includes(status)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

export default function DeliveryTrackingContent({
  orderId,
}: DeliveryTrackingContentProps) {
  const [order, setOrder] = useState<CustomerDeliveryTrackingOrder | null>(null);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<DeliveryTrackingEvent[]>(
    []
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTracking();
  }, [orderId]);

  async function loadTracking() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getCustomerDeliveryTracking(orderId);

      setOrder(result.order);
      setAssignments(result.assignments);
      setTrackingEvents(result.trackingEvents);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery tracking."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const latestAssignment = useMemo(() => {
    return assignments[assignments.length - 1] || null;
  }, [assignments]);

  const currentDriverPhone =
    latestAssignment?.driverPlatformPhone ||
    latestAssignment?.driverPhone ||
    order?.courierPhone ||
    "";

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading delivery tracking...</p>
      </div>
    );
  }

  if (message || !order) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-red-600">
          {message || "Delivery tracking not found."}
        </p>

        <Link
          href="/orders"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Delivery Tracking
            </p>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              Order {order.id}
            </h1>

            <p className="mt-2 text-gray-600">
              Track seller pickup, inter-city movement, final-mile delivery,
              driver assignment, and delivery completion.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                Order Status: {order.status}
              </span>

              <span className="rounded-full bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
                Payment: {order.paymentStatus}
              </span>

              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                Escrow: {order.escrowStatus}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={loadTracking}
            className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
          >
            Refresh Tracking
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Delivery Location</p>
            <p className="mt-2 text-gray-600">
              {order.deliveryCity}, {order.deliveryRegion}
            </p>
            <p className="mt-1 text-gray-600">{order.shippingAddress}</p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Tracking Code</p>
            <p className="mt-2 text-gray-600">
              {order.trackingCode || "Not assigned yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Created: {order.createdAt}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Delivery Contact</p>
            <p className="mt-2 text-gray-600">
              {latestAssignment?.driverName ||
                order.courierName ||
                "Driver not assigned yet"}
            </p>
            <p className="mt-1 text-gray-600">
              {currentDriverPhone || "Phone not available yet"}
            </p>

            {currentDriverPhone && (
              <a
                href={`tel:${currentDriverPhone}`}
                className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white"
              >
                Call Driver
              </a>
            )}
          </div>
        </div>

        {order.adminNote && (
          <div className="mt-5 rounded-xl bg-blue-50 p-4 text-blue-800">
            Delivery note: {order.adminNote}
          </div>
        )}
      </div>
{latestAssignment && (
  <section className="mt-8">
    <SimpleDeliveryMap
      title="Delivery Location Map"
      pickupLat={latestAssignment.pickupLat}
      pickupLng={latestAssignment.pickupLng}
      dropoffLat={latestAssignment.dropoffLat}
      dropoffLng={latestAssignment.dropoffLng}
      currentLat={latestAssignment.currentLat}
      currentLng={latestAssignment.currentLng}
      locationNote={latestAssignment.currentLocationNote}
    />
  </section>
)}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Assigned Delivery Persons
          </h2>

          <p className="mt-2 text-gray-600">
            Your order may have one delivery person for seller pickup,
            inter-city movement, intra-city transfer, or final-mile delivery.
          </p>
        </div>

        {assignments.length === 0 ? (
          <p className="mt-5 text-gray-600">
            No delivery driver has been assigned yet. You will see driver
            details here after admin assigns delivery.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {assignments.map((assignment) => {
              const phone =
                assignment.driverPlatformPhone || assignment.driverPhone || "";

              return (
                <div
                  key={assignment.id}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        {assignment.assignmentType}
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        {assignment.driverName || "Assigned Driver"}
                      </h3>

                      <p className="mt-1 text-gray-600">
                        {assignment.driverVehicleType}
                        {assignment.driverVehicleNumber
                          ? ` · ${assignment.driverVehicleNumber}`
                          : ""}
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

                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <p className="font-semibold text-gray-900">Route</p>

                    <p className="mt-2 text-gray-600">
                      Pickup: {assignment.pickupCity || "Not specified"},{" "}
                      {assignment.pickupRegion || ""}
                    </p>

                    <p className="mt-1 text-gray-600">
                      Drop-off: {assignment.dropoffCity || "Not specified"},{" "}
                      {assignment.dropoffRegion || ""}
                    </p>

                    {assignment.routeNote && (
                      <p className="mt-2 text-sm text-gray-600">
                        Route note: {assignment.routeNote}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="rounded-lg bg-black px-5 py-2 text-center text-sm font-semibold text-white"
                      >
                        Call Driver
                      </a>
                    )}

                    {assignment.adminNote && (
                      <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">
                        {assignment.adminNote}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
<DeliveryMessagesPanel orderId={order.id} viewerRole="customer" />
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Timeline
          </h2>

          <p className="mt-2 text-gray-600">
            Follow every delivery event from driver assignment to final delivery.
          </p>
        </div>

        {trackingEvents.length === 0 ? (
          <p className="mt-5 text-gray-600">
            No delivery tracking events yet.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {trackingEvents.map((event, index) => (
              <div
                key={event.id}
                className="grid gap-4 md:grid-cols-[auto_1fr]"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      event.eventStatus === "Delivered"
                        ? "bg-green-600 text-white"
                        : "bg-black text-white"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {index < trackingEvents.length - 1 && (
                    <div className="h-full min-h-8 w-px bg-gray-200" />
                  )}
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex flex-col justify-between gap-2 md:flex-row">
                    <div>
                      <p className="font-bold text-gray-900">
                        {event.eventTitle}
                      </p>

                      <p className="mt-1 text-gray-600">
                        {event.eventMessage}
                      </p>

                      {event.locationNote && (
                        <p className="mt-2 text-sm text-gray-500">
                          Location note: {event.locationNote}
                        </p>
                      )}
                    </div>
{typeof event.latitude === "number" &&
  typeof event.longitude === "number" && (
    <p className="mt-2 text-sm text-gray-500">
      Coordinates: {event.latitude.toFixed(6)},{" "}
      {event.longitude.toFixed(6)}
    </p>
  )}
                    <span
                      className={`h-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                        event.eventStatus
                      )}`}
                    >
                      {event.eventStatus}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    {event.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/orders"
          className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
        >
          Back to Orders
        </Link>

        <Link
          href="/notifications"
          className="rounded-lg bg-black px-6 py-3 text-center text-white"
        >
          View Notifications
        </Link>
      </div>
    </>
  );
}