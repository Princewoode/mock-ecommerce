"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/currency";
import {
  getAdminPayouts,
  markSellerPayoutPaid,
  PayoutTotals,
  SellerPayoutSummary,
} from "@/utils/adminPayoutService";

export default function AdminPayoutManager() {
  const [summaries, setSummaries] = useState<SellerPayoutSummary[]>([]);
  const [totals, setTotals] = useState<PayoutTotals | null>(null);
  const [references, setReferences] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayouts();
  }, []);

  async function loadPayouts() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getAdminPayouts();

      setSummaries(result.summaries);
      setTotals(result.totals);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load payouts."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkPaid(seller: SellerPayoutSummary) {
    const payoutReference = references[seller.sellerId] || "";

    try {
      const result = await markSellerPayoutPaid({
        itemIds: seller.eligibleItemIds,
        payoutReference,
      });

      setMessage(result.message);
      setReferences((current) => ({
        ...current,
        [seller.sellerId]: "",
      }));

      await loadPayouts();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to mark payout as paid."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Seller Payouts
        </h2>

        <p className="mt-4 text-gray-600">Loading seller payout data...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Seller Payouts
          </h2>

          <p className="mt-2 text-gray-600">
            Track marketplace commission and seller payout obligations. Only
            delivered orders are eligible for payout.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayouts}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Payouts
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      {totals && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Gross Seller Sales</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(totals.grossSales)}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Platform Commission</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(totals.platformCommission)}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Pending Seller Payout</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(totals.pendingPayout)}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Paid Seller Payout</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(totals.paidPayout)}
            </p>
          </div>
        </div>
      )}

      {summaries.length === 0 ? (
        <p className="mt-6 text-gray-600">
          No seller payout records found yet.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {summaries.map((seller) => (
            <div
              key={seller.sellerId}
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

                  <p className="mt-1 text-gray-600">
                    Phone: {seller.phone}
                  </p>

                  <p className="mt-1 text-gray-600">
                    MoMo Payout Number: {seller.momoNumber}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Location: {seller.city}, {seller.region}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">
                    Payout Summary
                  </p>

                  <div className="mt-3 space-y-2 text-gray-700">
                    <p>Gross Sales: {formatCurrency(seller.grossSales)}</p>
                    <p>
                      Platform Commission:{" "}
                      {formatCurrency(seller.platformCommission)}
                    </p>
                    <p>
                      Total Seller Payout:{" "}
                      {formatCurrency(seller.sellerPayout)}
                    </p>
                    <p>
                      Pending Eligible Payout:{" "}
                      {formatCurrency(seller.pendingPayout)}
                    </p>
                    <p>
                      Awaiting Delivery:{" "}
                      {formatCurrency(seller.awaitingDeliveryPayout)}
                    </p>
                    <p>Paid: {formatCurrency(seller.paidPayout)}</p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Payout Reference
                    </label>

                    <input
                      value={references[seller.sellerId] || ""}
                      onChange={(event) =>
                        setReferences((current) => ({
                          ...current,
                          [seller.sellerId]: event.target.value,
                        }))
                      }
                      placeholder="Example: MTN-MOMO-REF-12345"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMarkPaid(seller)}
                    disabled={seller.eligibleItemIds.length === 0}
                    className="mt-4 rounded-lg bg-black px-5 py-2 text-white disabled:bg-gray-400"
                  >
                    Mark Delivered Items as Paid
                  </button>

                  {seller.eligibleItemIds.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      No delivered unpaid items eligible for payout.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 overflow-x-auto border-t pt-5">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-3">Order</th>
                      <th className="py-3">Product</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Gross</th>
                      <th className="py-3">Commission</th>
                      <th className="py-3">Seller Payout</th>
                      <th className="py-3">Payout Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {seller.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 text-gray-700">
                          {item.orderId}
                        </td>

                        <td className="py-3 text-gray-700">
                          {item.productName}
                        </td>

                        <td className="py-3 text-gray-700">
                          {item.orderStatus}
                        </td>

                        <td className="py-3 text-gray-700">
                          {formatCurrency(item.grossAmount)}
                        </td>

                        <td className="py-3 text-gray-700">
                          {formatCurrency(item.platformCommissionAmount)}
                        </td>

                        <td className="py-3 font-semibold text-gray-900">
                          {formatCurrency(item.sellerPayoutAmount)}
                        </td>

                        <td className="py-3 text-gray-700">
                          {item.payoutStatus}
                          {item.payoutReference && (
                            <p className="mt-1 text-xs text-gray-500">
                              Ref: {item.payoutReference}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}