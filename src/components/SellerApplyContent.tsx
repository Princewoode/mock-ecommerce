"use client";

import { FormEvent, useState } from "react";
import { getCurrentCustomer } from "@/utils/authStorage";
import { ghanaRegions } from "@/utils/ghanaDelivery";
import { submitSellerApplication } from "@/utils/sellerService";

export default function SellerApplyContent() {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [region, setRegion] = useState("Greater Accra");
  const [city, setCity] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [productCategories, setProductCategories] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customer = getCurrentCustomer();

    try {
      setIsSubmitting(true);
      setMessage("");

      const result = await submitSellerApplication({
        userId: customer?.id,
        businessName,
        ownerName,
        phone,
        momoNumber,
        region,
        city,
        businessAddress,
        productCategories,
      });

      setMessage(result.message);

      setBusinessName("");
      setOwnerName("");
      setPhone("");
      setMomoNumber("");
      setRegion("Greater Accra");
      setCity("");
      setBusinessAddress("");
      setProductCategories("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Seller application failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Seller Application
        </h2>

        <p className="mt-2 text-gray-600">
          Apply to sell on the platform. Admin verification is required before
          sellers can publish products at scale.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Business Name
          </label>

          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Example: Adom Fashion Hub"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Owner / Contact Person
          </label>

          <input
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            placeholder="Example: Ama Mensah"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Business Phone
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
            Mobile Money Number for Payouts
          </label>

          <input
            value={momoNumber}
            onChange={(event) => setMomoNumber(event.target.value)}
            placeholder="Example: 0241234567"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
            placeholder="Example: Accra, Kumasi, Takoradi"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Business Address / Landmark
        </label>

        <textarea
          value={businessAddress}
          onChange={(event) => setBusinessAddress(event.target.value)}
          placeholder="Example: Near Kaneshie Market, opposite..."
          rows={3}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Categories
        </label>

        <textarea
          value={productCategories}
          onChange={(event) => setProductCategories(event.target.value)}
          placeholder="Example: Fashion, cosmetics, phones, home appliances, wholesale rice"
          rows={3}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
      >
        {isSubmitting ? "Submitting..." : "Submit Seller Application"}
      </button>
    </form>
  );
}