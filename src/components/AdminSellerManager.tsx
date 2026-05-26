"use client";

import { useEffect, useState } from "react";
import { SellerProfile } from "@/types/models";
import {
  getAdminSellers,
  updateSellerVerification,
} from "@/utils/sellerService";

const sellerStatuses = ["Pending", "Verified", "Rejected", "Suspended"];

export default function AdminSellerManager() {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSellers();
  }, []);

  async function loadSellers() {
    try {
      setIsLoading(true);

      const databaseSellers = await getAdminSellers();

      setSellers(databaseSellers);

      const nextNotes: Record<string, string> = {};
      const nextStatuses: Record<string, string> = {};

      databaseSellers.forEach((seller) => {
        nextNotes[seller.id] = seller.verificationNote || "";
        nextStatuses[seller.id] = seller.status;
      });

      setNotes(nextNotes);
      setStatuses(nextStatuses);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load sellers."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateSeller(sellerId: string) {
    try {
      const result = await updateSellerVerification({
        sellerId,
        status: statuses[sellerId] || "Pending",
        verificationNote: notes[sellerId] || "",
      });

      setMessage(result.message);
      await loadSellers();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update seller verification."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Seller Verification
        </h2>

        <p className="mt-4 text-gray-600">Loading seller applications...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Seller Verification
      </h2>

      <p className="mt-2 text-gray-600">
        Review Ghana seller applications before allowing full marketplace
        selling access.
      </p>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      {sellers.length === 0 ? (
        <p className="mt-6 text-gray-600">
          No seller applications submitted yet.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="rounded-xl border border-gray-200 p-5"
            >
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {seller.businessName}
                  </h3>

                  <p className="mt-2 text-gray-600">
                    Owner: {seller.ownerName}
                  </p>

                  <p className="mt-1 text-gray-600">Phone: {seller.phone}</p>

                  <p className="mt-1 text-gray-600">
                    MoMo Payout Number: {seller.momoNumber}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Location: {seller.city}, {seller.region}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Address: {seller.businessAddress}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Categories: {seller.productCategories}
                  </p>

                  <p className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    Current Status: {seller.status}
                  </p>
                </div>

                <div className="space-y-4 rounded-xl bg-gray-50 p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Verification Status
                    </label>

                    <select
                      value={statuses[seller.id] || seller.status}
                      onChange={(event) =>
                        setStatuses((current) => ({
                          ...current,
                          [seller.id]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                    >
                      {sellerStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Verification Note
                    </label>

                    <textarea
                      value={notes[seller.id] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [seller.id]: event.target.value,
                        }))
                      }
                      placeholder="Example: Verified phone and shop location."
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateSeller(seller.id)}
                    className="rounded-lg bg-black px-5 py-2 text-white"
                  >
                    Save Seller Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}