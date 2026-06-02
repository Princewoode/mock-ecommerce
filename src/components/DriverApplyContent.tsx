"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { DeliveryDriverProfile } from "@/types/models";
import {
  getCurrentDriverStatus,
  submitDriverApplication,
} from "@/utils/deliveryDriverService";
import { ghanaRegions } from "@/utils/ghanaDelivery";

const vehicleTypes = [
  "Motorbike",
  "Car",
  "Van",
  "Truck",
  "Bus Courier",
  "Inter-city Carrier",
];

export default function DriverApplyContent() {
  const [driver, setDriver] = useState<DeliveryDriverProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [region, setRegion] = useState("Greater Accra");
  const [city, setCity] = useState("");
  const [vehicleType, setVehicleType] = useState("Motorbike");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [ghanaCardReference, setGhanaCardReference] = useState("");
  const [intraCityZones, setIntraCityZones] = useState("");
  const [interCityRoutes, setInterCityRoutes] = useState("");
  const [availability, setAvailability] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [driverNote, setDriverNote] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDriverStatus();
  }, []);

  async function loadDriverStatus() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getCurrentDriverStatus();

      setIsLoggedIn(result.isLoggedIn);
      setDriver(result.driver);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load delivery driver status."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage("");

      const result = await submitDriverApplication({
        fullName,
        phone,
        momoNumber,
        region,
        city,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        ghanaCardReference,
        intraCityZones,
        interCityRoutes,
        availability,
        emergencyContact,
        driverNote,
      });

      setMessage(result.message);
      await loadDriverStatus();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to submit delivery driver application."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading delivery driver application...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Login Required
        </h2>

        <p className="mt-2 text-gray-600">
          Please login or register before applying to become a delivery driver.
        </p>

        <Link
          href="/account"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Login or Register
        </Link>
      </div>
    );
  }

  if (driver) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Driver Application Status
        </p>

        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          {driver.fullName}
        </h2>

        <p className="mt-3 inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
          Status: {driver.status}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Location</p>
            <p className="mt-2 text-gray-600">
              {driver.city}, {driver.region}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Vehicle</p>
            <p className="mt-2 text-gray-600">
              {driver.vehicleType}
              {driver.vehicleNumber ? ` · ${driver.vehicleNumber}` : ""}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Intra-city Zones</p>
            <p className="mt-2 text-gray-600">
              {driver.intraCityZones || "Not specified"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Inter-city Routes</p>
            <p className="mt-2 text-gray-600">
              {driver.interCityRoutes || "Not specified"}
            </p>
          </div>
        </div>

        {driver.verificationNote && (
          <div className="mt-5 rounded-xl bg-yellow-50 p-4 text-yellow-800">
            Admin note: {driver.verificationNote}
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Delivery Driver Application
        </h2>

        <p className="mt-2 text-gray-600">
          Apply to handle intra-city deliveries, inter-city transport, or final
          mile delivery for Ghana Marketplace.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>

          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Example: Kwame Mensah"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>

          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Example: 0241234567"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            MoMo Number for Payouts
          </label>

          <input
            value={momoNumber}
            onChange={(event) => setMomoNumber(event.target.value)}
            placeholder="Example: 0241234567"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle Type
          </label>

          <select
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Region
          </label>

          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            {ghanaRegions.map((ghanaRegion) => (
              <option key={ghanaRegion} value={ghanaRegion}>
                {ghanaRegion}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            City / Town
          </label>

          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Example: Accra, Kumasi, Tema, Tamale"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle / Plate Number
          </label>

          <input
            value={vehicleNumber}
            onChange={(event) => setVehicleNumber(event.target.value)}
            placeholder="Example: GR-1234-23"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            License Number
          </label>

          <input
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            placeholder="Optional for MVP"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Ghana Card / ID Reference
        </label>

        <input
          value={ghanaCardReference}
          onChange={(event) => setGhanaCardReference(event.target.value)}
          placeholder="Optional for MVP, useful for verification"
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      <div className="rounded-xl bg-blue-50 p-5">
        <h3 className="font-semibold text-gray-900">
          Route Coverage
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Help admin assign packages based on the routes you already use.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Intra-city Zones
            </label>

            <textarea
              value={intraCityZones}
              onChange={(event) => setIntraCityZones(event.target.value)}
              placeholder="Example: Accra East, Madina, East Legon, Spintex, Tema"
              rows={4}
              className="mt-2 w-full rounded-lg border border-blue-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Inter-city Routes
            </label>

            <textarea
              value={interCityRoutes}
              onChange={(event) => setInterCityRoutes(event.target.value)}
              placeholder="Example: Accra to Kumasi, Accra to Takoradi, Kumasi to Tamale"
              rows={4}
              className="mt-2 w-full rounded-lg border border-blue-200 px-4 py-3"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Availability
          </label>

          <input
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            placeholder="Example: Weekdays, evenings, weekends, full-time"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Emergency Contact
          </label>

          <input
            value={emergencyContact}
            onChange={(event) => setEmergencyContact(event.target.value)}
            placeholder="Example: 0201234567"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Driver Note
        </label>

        <textarea
          value={driverNote}
          onChange={(event) => setDriverNote(event.target.value)}
          placeholder="Example: I already deliver parcels from Accra to Kumasi every Friday."
          rows={4}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
      >
        {isSubmitting ? "Submitting Application..." : "Submit Driver Application"}
      </button>
    </form>
  );
}