"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SellerApplyContent from "@/components/SellerApplyContent";
import SellerDashboardContent from "@/components/SellerDashboardContent";
import { SellerProfile } from "@/types/models";
import { getCurrentSellerStatus } from "@/utils/sellerStatusService";

export default function SellerDashboardGateway() {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSellerStatus();
  }, []);

  async function loadSellerStatus() {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getCurrentSellerStatus();

      setIsLoggedIn(result.isLoggedIn);
      setSeller(result.seller);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load seller dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading seller dashboard...</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-red-600">{message}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Seller Access
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Login or register before becoming a seller
        </h1>

        <p className="mt-4 max-w-3xl text-gray-600">
          Sellers need an account before applying. After login, return to this
          seller dashboard to submit your business details, MoMo number,
          location, and product categories.
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

  if (!seller) {
    return (
      <>
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Seller Application
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Apply to sell on Ghana Marketplace
          </h1>

          <p className="mt-4 max-w-3xl text-gray-600">
            Complete your seller application below. Admin will review your
            business details before you can upload products and receive orders.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Business verification
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Helps buyers trust sellers.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">MoMo payout setup</p>
              <p className="mt-1 text-sm text-gray-600">
                MTN MoMo, Telecel Cash, and ATMoney-friendly seller operations.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Product approval flow
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Products go through admin review before public listing.
              </p>
            </div>
          </div>
        </div>

        <SellerApplyContent />
      </>
    );
  }

  if (seller.status === "Pending") {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-600">
          Seller Application Pending
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          {seller.businessName} is awaiting admin verification
        </h1>

        <p className="mt-4 max-w-3xl text-gray-600">
          Your seller application has been received. Admin must verify your
          business before you can upload products and receive orders.
        </p>

        <div className="mt-6 rounded-xl bg-yellow-50 p-5">
          <p className="font-semibold text-gray-900">Application details</p>
          <p className="mt-2 text-gray-700">Owner: {seller.ownerName}</p>
          <p className="mt-1 text-gray-700">
            Location: {seller.city}, {seller.region}
          </p>
          <p className="mt-1 text-gray-700">
            Categories: {seller.productCategories}
          </p>
        </div>

        {seller.verificationNote && (
          <div className="mt-5 rounded-xl bg-gray-50 p-5">
            <p className="font-semibold text-gray-900">Admin note</p>
            <p className="mt-2 text-gray-700">{seller.verificationNote}</p>
          </div>
        )}
      </div>
    );
  }

  if (seller.status === "Rejected") {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          Seller Application Rejected
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Your seller application needs attention
        </h1>

        <p className="mt-4 max-w-3xl text-gray-600">
          Admin rejected this seller application. Review the admin note and
          contact support or submit corrected business details when editing is
          added.
        </p>

        <div className="mt-6 rounded-xl bg-red-50 p-5">
          <p className="font-semibold text-gray-900">Admin note</p>
          <p className="mt-2 text-gray-700">
            {seller.verificationNote || "No reason provided."}
          </p>
        </div>
      </div>
    );
  }

  if (seller.status === "Suspended") {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          Seller Account Suspended
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Seller dashboard is currently locked
        </h1>

        <p className="mt-4 max-w-3xl text-gray-600">
          This seller account has been suspended. Contact admin for review
          before selling again.
        </p>

        {seller.verificationNote && (
          <div className="mt-6 rounded-xl bg-red-50 p-5">
            <p className="font-semibold text-gray-900">Admin note</p>
            <p className="mt-2 text-gray-700">{seller.verificationNote}</p>
          </div>
        )}
      </div>
    );
  }

  return <SellerDashboardContent />;
}