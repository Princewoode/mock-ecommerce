"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductVisual from "@/components/ProductVisual";
import { CartItem, Order, StoreProduct } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { getCurrentCustomer } from "@/utils/authStorage";
import { clearCart, getCartItems } from "@/utils/cartStorage";
import { addOrder } from "@/utils/orderStorage";
import { getProductCatalog } from "@/utils/productCatalogService";
import { reduceStockAfterOrder } from "@/utils/productStorage";
import { createDatabaseOrder } from "@/utils/supabaseOrderService";
import { getInitialOrderStatus } from "@/utils/orderStatus";
import {
  getDeliveryFee,
  ghanaRegions,
  isValidGhanaPhoneNumber,
} from "@/utils/ghanaDelivery";

const momoPaymentMethods = ["MTN Mobile Money", "Telecel Cash", "ATMoney"];

export default function CheckoutContent() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<StoreProduct[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [deliveryRegion, setDeliveryRegion] = useState("Greater Accra");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MTN Mobile Money");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [formError, setFormError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    async function loadCheckoutData() {
      setCartItems(getCartItems());
      setProductCatalog(await getProductCatalog());

      const customer = getCurrentCustomer();

      if (customer) {
        setFullName(customer.fullName);
        setEmail(customer.email);
        setShippingAddress(customer.shippingAddress);
      }
    }

    loadCheckoutData();
  }, []);

  const checkoutProducts = cartItems.flatMap((cartItem) => {
    const product = productCatalog.find((item) => item.id === cartItem.productId);

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

  const subtotal = checkoutProducts.reduce((sum, product) => {
    return sum + product.price * product.quantity;
  }, 0);

  const deliveryFee = getDeliveryFee(deliveryRegion);
  const total = subtotal + deliveryFee;
  const requiresMomoDetails = momoPaymentMethods.includes(paymentMethod);

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !shippingAddress.trim() ||
      !deliveryCity.trim() ||
      !deliveryPhone.trim()
    ) {
      setFormError("Please fill in all checkout and delivery fields.");
      return;
    }

    if (!isValidGhanaPhoneNumber(deliveryPhone)) {
      setFormError(
        "Please enter a valid Ghana delivery phone number, for example 0241234567 or +233241234567."
      );
      return;
    }

    if (requiresMomoDetails && !paymentPhone.trim()) {
      setFormError("Please enter the Mobile Money number used for payment.");
      return;
    }

    if (requiresMomoDetails && !isValidGhanaPhoneNumber(paymentPhone)) {
      setFormError(
        "Please enter a valid Ghana Mobile Money number, for example 0241234567 or +233241234567."
      );
      return;
    }

    if (checkoutProducts.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    const unavailableProduct = checkoutProducts.find(
      (product) => product.quantity > product.stock
    );

    if (unavailableProduct) {
      setFormError(
        `${unavailableProduct.name} only has ${unavailableProduct.stock} item(s) left in stock.`
      );
      return;
    }

    const currentCustomer = getCurrentCustomer();

    const paymentStatus =
      paymentMethod === "Cash on Delivery" ? "Pay on Delivery" : "Pending";

    const order: Order = {
      id: `MS-${Date.now()}`,
      customerId: currentCustomer?.id,
      createdAt: new Date().toLocaleString(),
      status: getInitialOrderStatus(paymentMethod),
      paymentMethod,
      payment: {
        status: paymentStatus,
        phone: paymentPhone,
        reference: paymentReference,
        note:
          paymentMethod === "Cash on Delivery"
            ? "Customer selected cash on delivery."
            : "Payment is pending admin confirmation.",
        escrowStatus: "Held",
      },
      customer: {
        fullName,
        email,
        shippingAddress,
      },
      delivery: {
        region: deliveryRegion,
        city: deliveryCity,
        phone: deliveryPhone,
        fee: deliveryFee,
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

    const stockItems: CartItem[] = checkoutProducts.map((product) => ({
      productId: product.id,
      quantity: product.quantity,
    }));

    try {
      setIsPlacingOrder(true);
      setFormError("");

      const savedOrder = await createDatabaseOrder(order);

      addOrder(savedOrder);
      reduceStockAfterOrder(stockItems);
      clearCart();

      router.push("/order-success");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save order to database."
      );
    } finally {
      setIsPlacingOrder(false);
    }
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
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <ProductVisual
                  image={product.image}
                  alt={product.name}
                  size="small"
                />

                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-gray-600">Quantity: {product.quantity}</p>
                  <p className="text-sm text-gray-500">
                    Available stock: {product.stock}
                  </p>
                </div>
              </div>

              <p className="font-bold text-gray-900">
                {formatCurrency(product.price * product.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Subtotal</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(subtotal)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-gray-600">Delivery Fee ({deliveryRegion})</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(deliveryFee)}
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-lg font-bold text-gray-900">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(total)}
            </p>
          </div>
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
            Shipping Address / Landmark
          </label>

          <textarea
            placeholder="Example: House number, street, landmark, GhanaPostGPS if available"
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            rows={4}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Delivery Region
            </label>

            <select
              value={deliveryRegion}
              onChange={(event) => setDeliveryRegion(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {ghanaRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              City / Town
            </label>

            <input
              type="text"
              placeholder="Example: Accra, Kumasi, Tema, Tamale"
              value={deliveryCity}
              onChange={(event) => setDeliveryCity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Delivery Phone Number
          </label>

          <input
            type="tel"
            placeholder="Example: 0241234567"
            value={deliveryPhone}
            onChange={(event) => setDeliveryPhone(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />

          <p className="mt-2 text-sm text-gray-500">
            Use a reachable Ghana phone number for delivery calls.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>

          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="MTN Mobile Money">MTN Mobile Money</option>
            <option value="Telecel Cash">Telecel Cash</option>
            <option value="ATMoney">ATMoney</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card Payment">Card Payment</option>
          </select>

          <p className="mt-2 text-sm text-gray-500">
            Mobile Money orders remain pending until admin confirms payment.
          </p>
        </div>

        {requiresMomoDetails && (
          <div className="rounded-xl bg-yellow-50 p-5">
            <h3 className="font-semibold text-gray-900">
              Mobile Money Payment Details
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Enter the MoMo number used for payment. Transaction reference can
              be added now or confirmed later by admin.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  MoMo Payment Number
                </label>

                <input
                  type="tel"
                  placeholder="Example: 0241234567"
                  value={paymentPhone}
                  onChange={(event) => setPaymentPhone(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Reference / Transaction ID
                </label>

                <input
                  type="text"
                  placeholder="Example: MOMO-REF-12345"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPlacingOrder}
          className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
        >
          {isPlacingOrder ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </>
  );
}