"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { AppNotification, Order, StoreProduct } from "@/types/models";
import { getCurrentCustomer } from "@/utils/authStorage";
import { getCustomerDatabaseOrders } from "@/utils/databaseOrderService";
import { getOrdersByCustomerEmail } from "@/utils/orderStorage";
import { getProductCatalog } from "@/utils/productCatalogService";
import { getUserNotifications } from "@/utils/notificationService";
import { getWishlistProductIds } from "@/utils/wishlistStorage";
import { getRecentlyViewedProductIds } from "@/utils/recentlyViewedStorage";
import { formatCurrency } from "@/utils/currency";

function DashboardCard({
  label,
  value,
  helper,
  href,
}: {
  label: string;
  value: string | number;
  helper?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {helper && <p className="mt-1 text-sm text-gray-600">{helper}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function BuyerDashboardContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    window.addEventListener("wishlistUpdated", loadDashboard);
    window.addEventListener("recentlyViewedUpdated", loadDashboard);
    window.addEventListener("notificationsUpdated", loadDashboard);
    window.addEventListener("cartUpdated", loadDashboard);

    return () => {
      window.removeEventListener("wishlistUpdated", loadDashboard);
      window.removeEventListener("recentlyViewedUpdated", loadDashboard);
      window.removeEventListener("notificationsUpdated", loadDashboard);
      window.removeEventListener("cartUpdated", loadDashboard);
    };
  }, []);

  async function loadDashboard() {
    const customer = getCurrentCustomer();

    if (!customer) {
      setCustomerName("");
      setCustomerEmail("");
      setOrders([]);
      setNotifications([]);
      setProducts([]);
      setWishlistIds([]);
      setRecentIds([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");
      setCustomerName(customer.fullName);
      setCustomerEmail(customer.email);

      const catalog = await getProductCatalog();
      setProducts(catalog);
      setWishlistIds(getWishlistProductIds());
      setRecentIds(getRecentlyViewedProductIds());

      try {
        const databaseOrders = await getCustomerDatabaseOrders({
          email: customer.email,
          customerId: customer.id,
        });

        setOrders(databaseOrders);
      } catch {
        setOrders(getOrdersByCustomerEmail(customer.email));
      }

      try {
        const userNotifications = await getUserNotifications();
        setNotifications(userNotifications);
      } catch {
        setNotifications([]);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load buyer dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const dashboardSummary = useMemo(() => {
    const totalSpend = orders.reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = orders.filter((order) =>
      ["Pending Payment", "Pending Confirmation", "Payment Confirmed"].includes(
        order.status
      )
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === "Delivered"
    ).length;

    const refundOrDisputeOrders = orders.filter((order) => {
      const refundStatus = order.customerAction?.refundStatus || "None";
      const disputeStatus = order.customerAction?.disputeStatus || "None";

      return refundStatus !== "None" || disputeStatus !== "None";
    }).length;

    const unreadNotifications = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    return {
      totalSpend,
      pendingOrders,
      deliveredOrders,
      refundOrDisputeOrders,
      unreadNotifications,
    };
  }, [orders, notifications]);

  const wishlistProducts = useMemo(() => {
    return wishlistIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is StoreProduct => Boolean(product))
      .slice(0, 3);
  }, [wishlistIds, products]);

  const recentlyViewedProducts = useMemo(() => {
    return recentIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is StoreProduct => Boolean(product))
      .slice(0, 3);
  }, [recentIds, products]);

  const recentOrders = orders.slice(0, 3);
  const recentNotifications = notifications.slice(0, 4);

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading buyer dashboard...</p>
      </div>
    );
  }

  if (!customerEmail) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Login Required
        </h2>

        <p className="mt-2 text-gray-600">
          Please login or register to view your buyer dashboard.
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

  return (
    <>
      <div className="mt-8 rounded-3xl bg-black p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">
          Buyer Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Welcome back, {customerName.split(" ")[0]}
        </h1>

        <p className="mt-3 max-w-3xl text-gray-200">
          Track your Ghana marketplace orders, MoMo payment updates, buyer
          protection actions, saved products, notifications, and recently viewed
          items.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-black"
          >
            Continue Shopping
          </Link>

          <Link
            href="/orders"
            className="rounded-xl border border-white px-6 py-3 text-center font-semibold text-white"
          >
            View Orders
          </Link>

          <Link
            href="/deals"
            className="rounded-xl border border-orange-300 px-6 py-3 text-center font-semibold text-white"
          >
            Group Deals
          </Link>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          {message}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <DashboardCard
          label="Total Orders"
          value={orders.length}
          helper="All orders placed"
          href="/orders"
        />

        <DashboardCard
          label="Estimated Spend"
          value={formatCurrency(dashboardSummary.totalSpend)}
          helper="Total order value"
          href="/orders"
        />

        <DashboardCard
          label="Unread Notifications"
          value={dashboardSummary.unreadNotifications}
          helper="Payment, delivery, refund, and seller updates"
          href="/notifications"
        />

        <DashboardCard
          label="Saved Products"
          value={wishlistIds.length}
          helper="Wishlist items"
          href="/wishlist"
        />

        <DashboardCard
          label="Pending Orders"
          value={dashboardSummary.pendingOrders}
          helper="Awaiting payment/admin/delivery progress"
          href="/orders"
        />

        <DashboardCard
          label="Delivered Orders"
          value={dashboardSummary.deliveredOrders}
          helper="Orders marked delivered"
          href="/orders"
        />

        <DashboardCard
          label="Refunds / Disputes"
          value={dashboardSummary.refundOrDisputeOrders}
          helper="Buyer protection activity"
          href="/orders"
        />

        <DashboardCard
          label="Recently Viewed"
          value={recentIds.length}
          helper="Products you checked earlier"
          href="/recently-viewed"
        />
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-gray-600">
                Latest order, payment, and delivery activity.
              </p>
            </div>

            <Link
              href="/orders"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="mt-5 text-gray-600">No orders yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900">
                        Order {order.id}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {order.createdAt}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-gray-700">
                        Status: {order.status}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Payment: {order.payment?.status || "Pending"} · Escrow:{" "}
                        {order.payment?.escrowStatus || "Held"}
                      </p>
                    </div>

                    <p className="font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Latest Notifications
              </h2>

              <p className="mt-1 text-gray-600">
                Marketplace updates that need your attention.
              </p>
            </div>

            <Link
              href="/notifications"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              View All
            </Link>
          </div>

          {recentNotifications.length === 0 ? (
            <p className="mt-5 text-gray-600">No notifications yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-4 ${
                    notification.isRead
                      ? "border-gray-200 bg-gray-50"
                      : "border-yellow-300 bg-yellow-50"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {notification.type}
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {notification.title}
                  </p>

                  <p className="mt-2 text-sm text-gray-700">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {notification.createdAt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Saved Products
            </h2>

            <p className="mt-1 text-gray-600">
              Items you saved for later comparison or WhatsApp sharing.
            </p>
          </div>

          <Link
            href="/wishlist"
            className="rounded-lg border border-gray-300 px-5 py-2 text-center text-gray-900"
          >
            Open Wishlist
          </Link>
        </div>

        {wishlistProducts.length === 0 ? (
          <p className="mt-5 text-gray-600">
            No saved products yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                category={product.category}
                description={product.description}
                price={product.price}
                image={product.image}
                stock={product.stock}
                sellerId={product.sellerId}
                sellerBusinessName={product.sellerBusinessName}
                groupDealEnabled={product.groupDealEnabled}
                groupPrice={product.groupPrice}
                groupMinQuantity={product.groupMinQuantity}
                groupDealNote={product.groupDealNote}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recently Viewed
            </h2>

            <p className="mt-1 text-gray-600">
              Products you opened recently.
            </p>
          </div>

          <Link
            href="/recently-viewed"
            className="rounded-lg border border-gray-300 px-5 py-2 text-center text-gray-900"
          >
            View History
          </Link>
        </div>

        {recentlyViewedProducts.length === 0 ? (
          <p className="mt-5 text-gray-600">
            No recently viewed products yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyViewedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                category={product.category}
                description={product.description}
                price={product.price}
                image={product.image}
                stock={product.stock}
                sellerId={product.sellerId}
                sellerBusinessName={product.sellerBusinessName}
                groupDealEnabled={product.groupDealEnabled}
                groupPrice={product.groupPrice}
                groupMinQuantity={product.groupMinQuantity}
                groupDealNote={product.groupDealNote}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}