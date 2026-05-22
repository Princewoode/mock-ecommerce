import { CustomerUser, Order } from "@/types/models";
import {
  readLocalData,
  removeLocalData,
  writeLocalData,
} from "@/utils/localDatabase";

const ORDERS_KEY = "orders";
const LAST_ORDER_KEY = "lastOrder";
const ORDERS_EVENT = "ordersUpdated";

export function getOrders(): Order[] {
  return readLocalData<Order[]>(ORDERS_KEY, []);
}

export function saveOrders(orders: Order[]) {
  writeLocalData(ORDERS_KEY, orders, ORDERS_EVENT);
}

export function getLastOrder(): Order | null {
  return readLocalData<Order | null>(LAST_ORDER_KEY, null);
}

export function setLastOrder(order: Order) {
  writeLocalData(LAST_ORDER_KEY, order, ORDERS_EVENT);
}

export function clearLastOrder() {
  removeLocalData(LAST_ORDER_KEY, ORDERS_EVENT);
}

export function addOrder(order: Order) {
  const orders = getOrders();
  const updatedOrders = [order, ...orders];

  saveOrders(updatedOrders);
  setLastOrder(order);
}

export function clearOrders() {
  removeLocalData(ORDERS_KEY, ORDERS_EVENT);
  removeLocalData(LAST_ORDER_KEY, ORDERS_EVENT);
}

export function getOrdersByCustomerEmail(email: string): Order[] {
  return getOrders().filter(
    (order) => order.customer.email.toLowerCase() === email.toLowerCase()
  );
}

export function updateOrderStatus(orderId: string, status: string) {
  const orders = getOrders();

  const updatedOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
        }
      : order
  );

  saveOrders(updatedOrders);

  const lastOrder = getLastOrder();

  if (lastOrder && lastOrder.id === orderId) {
    const updatedLastOrder = updatedOrders.find((order) => order.id === orderId);

    if (updatedLastOrder) {
      setLastOrder(updatedLastOrder);
    }
  }
}

export function deleteOrder(orderId: string) {
  const orders = getOrders();
  const updatedOrders = orders.filter((order) => order.id !== orderId);

  saveOrders(updatedOrders);

  const lastOrder = getLastOrder();

  if (lastOrder && lastOrder.id === orderId) {
    if (updatedOrders.length > 0) {
      setLastOrder(updatedOrders[0]);
    } else {
      clearLastOrder();
    }
  }
}

export function updateOrdersForCustomerEmail(
  oldEmail: string,
  updatedCustomer: CustomerUser
) {
  const orders = getOrders();

  const updatedOrders = orders.map((order) => {
    if (order.customer.email.toLowerCase() !== oldEmail.toLowerCase()) {
      return order;
    }

    return {
      ...order,
      customer: {
        fullName: updatedCustomer.fullName,
        email: updatedCustomer.email,
        shippingAddress: updatedCustomer.shippingAddress,
      },
    };
  });

  saveOrders(updatedOrders);

  const lastOrder = getLastOrder();

  if (lastOrder && lastOrder.customer.email.toLowerCase() === oldEmail.toLowerCase()) {
    setLastOrder({
      ...lastOrder,
      customer: {
        fullName: updatedCustomer.fullName,
        email: updatedCustomer.email,
        shippingAddress: updatedCustomer.shippingAddress,
      },
    });
  }
}