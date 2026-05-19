import { products as defaultProducts } from "@/data/products";

export type StoreProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
};

const CUSTOM_PRODUCTS_KEY = "customProducts";

export function getCustomProducts(): StoreProduct[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedProducts = localStorage.getItem(CUSTOM_PRODUCTS_KEY);

  if (!savedProducts) {
    return [];
  }

  try {
    return JSON.parse(savedProducts) as StoreProduct[];
  } catch {
    return [];
  }
}

export function getAllProducts(): StoreProduct[] {
  return [...defaultProducts, ...getCustomProducts()];
}

export function saveCustomProducts(products: StoreProduct[]) {
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("productsUpdated"));
}

export function clearCustomProducts() {
  localStorage.removeItem(CUSTOM_PRODUCTS_KEY);
  window.dispatchEvent(new Event("productsUpdated"));
}