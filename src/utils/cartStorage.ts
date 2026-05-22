import { CartItem } from "@/types/models";
import {
  readLocalData,
  removeLocalData,
  writeLocalData,
} from "@/utils/localDatabase";
import { getAllProducts } from "@/utils/productStorage";

const CART_KEY = "cartItems";
const OLD_CART_KEY = "cartProductId";
const CART_EVENT = "cartUpdated";

type CartActionResult = {
  success: boolean;
  message?: string;
};

export function getCartItems(): CartItem[] {
  return readLocalData<CartItem[]>(CART_KEY, []);
}

export function saveCartItems(items: CartItem[]) {
  const cleanedItems = items.filter((item) => item.quantity > 0);

  writeLocalData(CART_KEY, cleanedItems, CART_EVENT);
}

export function clearCart() {
  removeLocalData(CART_KEY);
  removeLocalData(OLD_CART_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCartCount(): number {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
}

export function addProductToCart(productId: number): CartActionResult {
  const product = getAllProducts().find((item) => item.id === productId);

  if (!product) {
    return {
      success: false,
      message: "Product not found.",
    };
  }

  if (product.stock <= 0) {
    return {
      success: false,
      message: "This product is out of stock.",
    };
  }

  const cartItems = getCartItems();
  const existingItem = cartItems.find((item) => item.productId === productId);

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      return {
        success: false,
        message: `Only ${product.stock} item(s) available in stock.`,
      };
    }

    existingItem.quantity += 1;
  } else {
    cartItems.push({
      productId,
      quantity: 1,
    });
  }

  saveCartItems(cartItems);
  removeLocalData(OLD_CART_KEY);

  return {
    success: true,
  };
}

export function increaseCartItem(productId: number): CartActionResult {
  return addProductToCart(productId);
}

export function decreaseCartItem(productId: number) {
  const cartItems = getCartItems();

  const updatedItems = cartItems
    .map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: item.quantity - 1,
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  saveCartItems(updatedItems);
}

export function removeCartItem(productId: number) {
  const cartItems = getCartItems();

  const updatedItems = cartItems.filter((item) => item.productId !== productId);

  saveCartItems(updatedItems);
}