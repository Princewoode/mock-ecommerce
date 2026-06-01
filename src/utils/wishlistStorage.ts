import {
  readLocalData,
  writeLocalData,
} from "@/utils/localDatabase";

const WISHLIST_KEY = "wishlistProductIds";
const WISHLIST_EVENT = "wishlistUpdated";

export function getWishlistProductIds(): number[] {
  return readLocalData<number[]>(WISHLIST_KEY, []);
}

export function saveWishlistProductIds(productIds: number[]) {
  const uniqueIds = Array.from(new Set(productIds));

  writeLocalData(WISHLIST_KEY, uniqueIds, WISHLIST_EVENT);
}

export function isProductInWishlist(productId: number) {
  return getWishlistProductIds().includes(productId);
}

export function addProductToWishlist(productId: number) {
  const productIds = getWishlistProductIds();

  if (!productIds.includes(productId)) {
    saveWishlistProductIds([...productIds, productId]);
  }
}

export function removeProductFromWishlist(productId: number) {
  const productIds = getWishlistProductIds();

  saveWishlistProductIds(productIds.filter((id) => id !== productId));
}

export function toggleProductWishlist(productId: number) {
  if (isProductInWishlist(productId)) {
    removeProductFromWishlist(productId);
    return false;
  }

  addProductToWishlist(productId);
  return true;
}

export function getWishlistCount() {
  return getWishlistProductIds().length;
}

export function clearWishlist() {
  saveWishlistProductIds([]);
}