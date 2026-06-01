import {
  readLocalData,
  writeLocalData,
} from "@/utils/localDatabase";

const RECENTLY_VIEWED_KEY = "recentlyViewedProducts";
const RECENTLY_VIEWED_EVENT = "recentlyViewedUpdated";

export type RecentlyViewedItem = {
  productId: number;
  viewedAt: string;
};

export function getRecentlyViewedItems(): RecentlyViewedItem[] {
  return readLocalData<RecentlyViewedItem[]>(RECENTLY_VIEWED_KEY, []);
}

export function saveRecentlyViewedItems(items: RecentlyViewedItem[]) {
  writeLocalData(RECENTLY_VIEWED_KEY, items, RECENTLY_VIEWED_EVENT);
}

export function recordProductView(productId: number) {
  const existingItems = getRecentlyViewedItems();

  const updatedItems = [
    {
      productId,
      viewedAt: new Date().toISOString(),
    },
    ...existingItems.filter((item) => item.productId !== productId),
  ].slice(0, 20);

  saveRecentlyViewedItems(updatedItems);
}

export function getRecentlyViewedProductIds(): number[] {
  return getRecentlyViewedItems().map((item) => item.productId);
}

export function clearRecentlyViewedProducts() {
  saveRecentlyViewedItems([]);
}