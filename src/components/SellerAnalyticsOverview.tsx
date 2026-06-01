"use client";

import { useEffect, useMemo, useState } from "react";
import { Order } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import {
  getSellerProducts,
  SellerProduct,
} from "@/utils/sellerProductService";
import { getSellerOrders } from "@/utils/sellerOrderService";

function SellerStatCard({
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

export default function SellerAnalyticsOverview() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSellerAnalytics();

    window.addEventListener("productsUpdated", loadSellerAnalytics);

    return () => {
      window.removeEventListener("productsUpdated", loadSellerAnalytics);
    };
  }, []);

  async function loadSellerAnalytics() {
    try {
      setIsLoading(true);
      setMessage("");

      const [sellerProducts, sellerOrders] = await Promise.all([
        getSellerProducts(),
        getSellerOrders(),
      ]);

      setProducts(sellerProducts);
      setOrders(sellerOrders);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load seller analytics."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const analytics = useMemo(() => {
    const productStatuses: Record<string, number> = {};
    const orderStatuses: Record<string, number> = {};
    const paymentStatuses: Record<string, number> = {};
    const escrowStatuses: Record<string, number> = {};

    let grossSales = 0;
    let platformCommission = 0;
    let estimatedPayout = 0;
    let totalUnitsSold = 0;

    orders.forEach((order) => {
      orderStatuses[order.status] = (orderStatuses[order.status] || 0) + 1;

      const paymentStatus = order.payment?.status || "Unknown";
      const escrowStatus = order.payment?.escrowStatus || "Unknown";

      paymentStatuses[paymentStatus] =
        (paymentStatuses[paymentStatus] || 0) + 1;

      escrowStatuses[escrowStatus] = (escrowStatuses[escrowStatus] || 0) + 1;

      order.items.forEach((item) => {
        const itemGross = item.price * item.quantity;

        grossSales += itemGross;
        platformCommission += item.platformCommissionAmount || 0;
        estimatedPayout += item.sellerPayoutAmount || itemGross;
        totalUnitsSold += item.quantity;
      });
    });

    products.forEach((product) => {
      const status = product.productStatus || "Approved";
      productStatuses[status] = (productStatuses[status] || 0) + 1;
    });

    const approvedProducts = products.filter(
      (product) => product.productStatus === "Approved"
    ).length;

    const pendingProducts = products.filter(
      (product) => product.productStatus === "Pending Review"
    ).length;

    const rejectedProducts = products.filter(
      (product) => product.productStatus === "Rejected"
    ).length;

    const suspendedProducts = products.filter(
      (product) => product.productStatus === "Suspended"
    ).length;

    const lowStockProducts = products.filter(
      (product) => product.stock > 0 && product.stock <= 3
    ).length;

    const outOfStockProducts = products.filter(
      (product) => product.stock <= 0
    ).length;

    const groupDealProducts = products.filter(
      (product) => product.groupDealEnabled
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === "Delivered"
    ).length;

    const refundOrDisputeOrders = orders.filter((order) => {
      const refundStatus = order.customerAction?.refundStatus || "None";
      const disputeStatus = order.customerAction?.disputeStatus || "None";

      return refundStatus !== "None" || disputeStatus !== "None";
    }).length;

    return {
      grossSales,
      platformCommission,
      estimatedPayout,
      totalUnitsSold,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      suspendedProducts,
      lowStockProducts,
      outOfStockProducts,
      groupDealProducts,
      deliveredOrders,
      refundOrDisputeOrders,
      productStatuses,
      orderStatuses,
      paymentStatuses,
      escrowStatuses,
    };
  }, [products, orders]);

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Seller Performance Overview
        </h2>

        <p className="mt-4 text-gray-600">Loading seller analytics...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Seller Performance Overview
          </h2>

          <p className="mt-2 text-gray-600">
            Track products, orders, group deals, payment status, escrow status,
            sales, commission deductions, and estimated payout.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSellerAnalytics}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Refresh Overview
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <SellerStatCard
          label="Gross Seller Sales"
          value={formatCurrency(analytics.grossSales)}
          helper="Before platform commission"
        />

        <SellerStatCard
          label="Estimated Payout"
          value={formatCurrency(analytics.estimatedPayout)}
          helper="After commission deduction"
        />

        <SellerStatCard
          label="Platform Commission"
          value={formatCurrency(analytics.platformCommission)}
          helper="Marketplace commission"
        />

        <SellerStatCard
          label="Units Sold"
          value={analytics.totalUnitsSold}
          helper="Quantity sold across orders"
        />

        <SellerStatCard
          label="Total Products"
          value={products.length}
          helper="All uploaded products"
        />

        <SellerStatCard
          label="Approved Products"
          value={analytics.approvedProducts}
          helper="Visible to buyers"
        />

        <SellerStatCard
          label="Pending Review"
          value={analytics.pendingProducts}
          helper="Awaiting admin approval"
        />

        <SellerStatCard
          label="Group Deal Products"
          value={analytics.groupDealProducts}
          helper="Bulk/group discount listings"
        />

        <SellerStatCard
          label="Low Stock"
          value={analytics.lowStockProducts}
          helper="Stock between 1 and 3"
        />

        <SellerStatCard
          label="Out of Stock"
          value={analytics.outOfStockProducts}
          helper="Needs restocking"
        />

        <SellerStatCard
          label="Delivered Orders"
          value={analytics.deliveredOrders}
          helper="Marked delivered"
        />

        <SellerStatCard
          label="Refunds / Disputes"
          value={analytics.refundOrDisputeOrders}
          helper="Buyer protection activity"
        />
      </div>

      {(analytics.rejectedProducts > 0 || analytics.suspendedProducts > 0) && (
        <div className="mt-6 rounded-xl bg-red-50 p-5">
          <p className="font-semibold text-red-800">
            Product review attention required
          </p>

          <p className="mt-2 text-sm text-red-700">
            You have {analytics.rejectedProducts} rejected product(s) and{" "}
            {analytics.suspendedProducts} suspended product(s). Review admin
            notes and edit products where needed.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <CounterList
          title="Product Statuses"
          data={analytics.productStatuses}
        />

        <CounterList title="Order Statuses" data={analytics.orderStatuses} />

        <CounterList
          title="Payment Statuses"
          data={analytics.paymentStatuses}
        />

        <CounterList title="Escrow Statuses" data={analytics.escrowStatuses} />
      </div>
    </div>
  );
}