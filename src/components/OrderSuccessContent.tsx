"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";
import { getLastOrder } from "@/utils/orderStorage";
import { formatCurrency } from "@/utils/currency";
type OrderItem = {
  productId: number;
  name: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  customerId?: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  customer: {
    fullName: string;
    email: string;
    shippingAddress: string;
  };
  delivery?: {
    region: string;
    city: string;
    phone: string;
    fee: number;
  };
  items: OrderItem[];
  total: number;
};

export default function OrderSuccessContent() {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    setOrder(getLastOrder());
  }, []);

  if (!order) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900">No Recent Order</h1>

        <p className="mt-4 text-lg text-gray-600">
          You have not placed an order yet.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Continue Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
      <h1 className="text-4xl font-bold text-gray-900">
        Order Placed Successfully
      </h1>

      <p className="mt-4 text-lg text-gray-600">
        Thank you, {order.customer.fullName}. Your order has been saved.
      </p>

      <div className="mx-auto mt-8 max-w-xl rounded-xl border border-gray-200 p-5 text-left">
        <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

        <p className="mt-2 text-sm text-gray-600">Order ID: {order.id}</p>
        <p className="text-sm text-gray-600">Date: {order.createdAt}</p>
<p className="text-sm text-gray-600">Status: {order.status}</p>
<p className="text-sm text-gray-600">
  Payment Method: {order.paymentMethod || "Not specified"}
</p>

{order.delivery && (
  <div className="mt-2 text-gray-600">
    <p>
      Delivery: {order.delivery.city}, {order.delivery.region}
    </p>
    <p>Phone: {order.delivery.phone}</p>
    <p>Delivery Fee: {formatCurrency(order.delivery.fee)}</p>
  </div>
)}
        <div className="mt-4 space-y-4 border-t pt-4">
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <ProductVisual image={item.image} alt={item.name} size="small" />

                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
              </div>

              <p className="font-bold text-gray-900">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-lg font-bold text-gray-900">Total</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(order.total)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <Link
          href="/products"
          className="inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Continue Shopping
        </Link>

        <Link
          href="/orders"
          className="inline-block rounded-lg border border-gray-300 px-6 py-3 text-gray-900"
        >
          View Orders
        </Link>
      </div>
    </section>
  );
}