import { StoreProduct } from "@/types/models";
import { getSupabaseProducts } from "@/utils/supabaseProductService";
import { getAllProducts, getCustomProducts } from "@/utils/productStorage";

export async function getProductCatalog(): Promise<StoreProduct[]> {
  try {
    const databaseProducts = await getSupabaseProducts();

    if (databaseProducts.length > 0) {
      const customProducts = getCustomProducts();
      const databaseProductIds = new Set(
        databaseProducts.map((product) => product.id)
      );

      const uniqueCustomProducts = customProducts.filter(
        (product) => !databaseProductIds.has(product.id)
      );

      return [...databaseProducts, ...uniqueCustomProducts];
    }

    return getAllProducts();
  } catch {
    return getAllProducts();
  }
}