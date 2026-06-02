"use client";

import { useParams } from "next/navigation";
import DeliveryTrackingContent from "@/components/DeliveryTrackingContent";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = String(params.orderId || "");

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <DeliveryTrackingContent orderId={orderId} />
      </section>
    </main>
  );
}