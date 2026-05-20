"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllProducts, StoreProduct } from "@/utils/productStorage";
import ProductVisual from "@/components/ProductVisual";
type CartItem = {
  productId: number;
  quantity: number;
};

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
  createdAt: string;
  status: string;
  customer: {
    fullName: string;
    email: string;
    shippingAddress: string;
  };
  items: OrderItem[];
  total: number;
};

export default function CheckoutContent() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
 const [productCatalog, setProductCatalog] = useState<StoreProduct[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    const items: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
    setCartItems(items);
    setProductCatalog(getAllProducts());
  }, []);

  const checkoutProducts = cartItems.flatMap((cartItem) => {
   const product = productCatalog.find(
  (item) => item.id === cartItem.productId
);
    if (!product) {
      return [];
    }

    return [
      {
        ...product,
        quantity: cartItem.quantity,
      },
    ];
  });

  const total = checkoutProducts.reduce((sum, product) => {
    return sum + product.price * product.quantity;
  }, 0);

  function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !shippingAddress.trim()) {
      setFormError("Please fill in all checkout fields.");
      return;
    }

    if (checkoutProducts.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    const order: Order = {
  id: `MS-${Date.now()}`,
  createdAt: new Date().toLocaleString(),
  status: "Pending",
  customer: {
        fullName,
        email,
        shippingAddress,
      },
      items: checkoutProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        price: product.price,
        quantity: product.quantity,
      })),
      total,
    };

    const savedOrders = localStorage.getItem("orders");
    const orders: Order[] = savedOrders ? JSON.parse(savedOrders) : [];

    localStorage.setItem("orders", JSON.stringify([order, ...orders]));
    localStorage.setItem("lastOrder", JSON.stringify(order));
    localStorage.removeItem("cartItems");
    localStorage.removeItem("cartProductId");

    window.dispatchEvent(new Event("cartUpdated"));

    router.push("/order-success");
  }

  if (checkoutProducts.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">
          Your cart is empty. Please add a product before checkout.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Go to Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>

        <div className="mt-4 space-y-4 border-t pt-4">
          {checkoutProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <ProductVisual image={product.image} alt={product.name} size="small" />

                <div>
                  <p className="font-semibold text-gray-900">
                    {product.name}
                  </p>
                  <p className="text-gray-600">
                    Quantity: {product.quantity}
                  </p>
                </div>
              </div>

              <p className="font-bold text-gray-900">
                ${(product.price * product.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-lg font-bold text-gray-900">Total</p>
          <p className="text-lg font-bold text-gray-900">
            ${total.toFixed(2)}
          </p>
        </div>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm"
      >
        {formError && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Shipping Address
          </label>

          <textarea
            placeholder="Enter your shipping address"
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            rows={4}
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-black px-6 py-3 text-white"
        >
          Place Mock Order
        </button>
      </form>
    </>
  );
}