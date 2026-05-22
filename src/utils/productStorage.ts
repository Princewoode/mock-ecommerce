import { products as defaultProducts } from "@/data/products";
import { CartItem, StoreProduct } from "@/types/models";
import {
  readLocalData,
  removeLocalData,
  writeLocalData,
} from "@/utils/localDatabase";

export type { StoreProduct };
export type CartStockItem = CartItem;

const CUSTOM_PRODUCTS_KEY = "customProducts";
const STOCK_OVERRIDES_KEY = "stockOverrides";
const PRODUCTS_EVENT = "productsUpdated";

function getStockOverrides(): Record<string, number> {
  return readLocalData<Record<string, number>>(STOCK_OVERRIDES_KEY, {});
}

function saveStockOverrides(overrides: Record<string, number>) {
  writeLocalData<Record<string, number>>(STOCK_OVERRIDES_KEY, overrides);
}

export function getCustomProducts(): StoreProduct[] {
  const savedProducts = readLocalData<Partial<StoreProduct>[]>(
    CUSTOM_PRODUCTS_KEY,
    []
  );

  return savedProducts.map((product) => ({
    id: Number(product.id),
    name: product.name || "Untitled Product",
    category: product.category || "Uncategorized",
    description: product.description || "",
    price: Number(product.price) || 0,
    image: product.image || "📦",
    stock: Number(product.stock) || 0,
  }));
}

export function getDefaultProductsWithStock(): StoreProduct[] {
  const overrides = getStockOverrides();

  return defaultProducts.map((product) => ({
    ...product,
    stock:
      overrides[product.id.toString()] !== undefined
        ? overrides[product.id.toString()]
        : product.stock,
  }));
}

export function getAllProducts(): StoreProduct[] {
  return [...getDefaultProductsWithStock(), ...getCustomProducts()];
}

export function getProductById(productId: number): StoreProduct | null {
  return getAllProducts().find((product) => product.id === productId) || null;
}

export function saveCustomProducts(products: StoreProduct[]) {
  writeLocalData<StoreProduct[]>(
    CUSTOM_PRODUCTS_KEY,
    products,
    PRODUCTS_EVENT
  );
}

export function clearCustomProducts() {
  removeLocalData(CUSTOM_PRODUCTS_KEY, PRODUCTS_EVENT);
}

export function reduceStockAfterOrder(orderItems: CartItem[]) {
  const customProducts = getCustomProducts();
  const stockOverrides = getStockOverrides();

  const updatedCustomProducts = customProducts.map((product) => {
    const orderedItem = orderItems.find((item) => item.productId === product.id);

    if (!orderedItem) {
      return product;
    }

    return {
      ...product,
      stock: Math.max(product.stock - orderedItem.quantity, 0),
    };
  });

  orderItems.forEach((orderedItem) => {
    const isCustomProduct = customProducts.some(
      (product) => product.id === orderedItem.productId
    );

    if (isCustomProduct) {
      return;
    }

    const defaultProduct = defaultProducts.find(
      (product) => product.id === orderedItem.productId
    );

    if (!defaultProduct) {
      return;
    }

    const currentStock =
      stockOverrides[orderedItem.productId.toString()] !== undefined
        ? stockOverrides[orderedItem.productId.toString()]
        : defaultProduct.stock;

    stockOverrides[orderedItem.productId.toString()] = Math.max(
      currentStock - orderedItem.quantity,
      0
    );
  });

  writeLocalData<StoreProduct[]>(CUSTOM_PRODUCTS_KEY, updatedCustomProducts);
  saveStockOverrides(stockOverrides);

  window.dispatchEvent(new Event(PRODUCTS_EVENT));
}