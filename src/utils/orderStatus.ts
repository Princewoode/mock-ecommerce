export const orderStatuses = [
  "Pending",
  "Pending Payment",
  "Pending Confirmation",
  "Payment Confirmed",
  "Processing",
  "Ready for Dispatch",
  "Out for Delivery",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refund Requested",
  "Refunded",
];

export function getInitialOrderStatus(paymentMethod: string) {
  if (paymentMethod === "Cash on Delivery") {
    return "Pending Confirmation";
  }

  return "Pending Payment";
}