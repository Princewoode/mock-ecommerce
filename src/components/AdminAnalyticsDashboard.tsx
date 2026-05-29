"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/currency";
import {
  AdminAnalytics,
  getAdminAnalytics,
} from "@/utils/adminAnalyticsService";

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

function CounterList({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No data yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 text-sm">
              <span className="text-gray-600">{key}</span>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getAdminAnalytics();

      setAnalytics(result);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load analytics."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Marketplace Analytics
        </h2>

        <p className="mt-4 text-gray-600">Loading marketplace analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Marketplace Analytics
        </h2>

        <p className="mt-4 text-red-600">{message}</p>
      </div>
    );
  }

  const { summary } = analytics;

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Marketplace Analytics
          </h2>

          <p className="mt-2 text-gray-600">
            Investor-facing overview of sales, sellers, products, payment,
            escrow, refunds, disputes, and Ghana regional demand.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Analytics
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard
          label="Gross Merchandise Value"
          value={formatCurrency(summary.grossMerchandiseValue)}
          helper="Total customer order value"
        />

        <StatCard
          label="Platform Commission"
          value={formatCurrency(summary.platformCommission)}
          helper="Marketplace revenue before costs"
        />

        <StatCard
          label="Pending Seller Payout"
          value={formatCurrency(summary.pendingSellerPayout)}
          helper="Amount still owed to sellers"
        />

        <StatCard
          label="Paid Seller Payout"
          value={formatCurrency(summary.paidSellerPayout)}
          helper="Seller payout already marked paid"
        />

        <StatCard label="Total Orders" value={summary.totalOrders} />

        <StatCard label="Total Customers" value={summary.totalCustomers} />

        <StatCard
          label="Verified Sellers"
          value={summary.verifiedSellers}
          helper={`${summary.pendingSellers} pending seller application(s)`}
        />

        <StatCard
          label="Approved Products"
          value={summary.approvedProducts}
          helper={`${summary.pendingProducts} pending product review(s)`}
        />

        <StatCard
          label="Refund Requests"
          value={summary.refundRequests}
          helper="Orders with refund activity"
        />

        <StatCard
          label="Open Dispute Activity"
          value={summary.openDisputes}
          helper="Orders with dispute activity"
        />

        <StatCard
          label="Seller Payout Total"
          value={formatCurrency(summary.sellerPayout)}
        />

        <StatCard label="Total Products" value={summary.totalProducts} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <CounterList title="Orders by Status" data={analytics.ordersByStatus} />
        <CounterList title="Payment Methods" data={analytics.paymentMethods} />
        <CounterList title="Payment Statuses" data={analytics.paymentStatuses} />
        <CounterList title="Escrow Statuses" data={analytics.escrowStatuses} />
        <CounterList title="Seller Statuses" data={analytics.sellerStatuses} />
        <CounterList title="Product Statuses" data={analytics.productStatuses} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">
            Top Ghana Delivery Regions
          </h3>

          {analytics.topRegions.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No regional data yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {analytics.topRegions.map((region) => (
                <div
                  key={region.region}
                  className="border-b border-gray-200 pb-2 text-sm"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-gray-900">
                      {region.region}
                    </span>
                    <span className="text-gray-600">
                      {region.orderCount} order(s)
                    </span>
                  </div>

                  <p className="mt-1 text-gray-600">
                    Revenue: {formatCurrency(region.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">Top Products</h3>

          {analytics.topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No product sales yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {analytics.topProducts.map((product) => (
                <div
                  key={product.productName}
                  className="border-b border-gray-200 pb-2 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    {product.productName}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Qty: {product.quantitySold} · Sales:{" "}
                    {formatCurrency(product.grossSales)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">Top Sellers</h3>

          {analytics.topSellers.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No seller sales yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {analytics.topSellers.map((seller) => (
                <div
                  key={seller.sellerName}
                  className="border-b border-gray-200 pb-2 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    {seller.sellerName}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Qty: {seller.quantitySold} · Sales:{" "}
                    {formatCurrency(seller.grossSales)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}