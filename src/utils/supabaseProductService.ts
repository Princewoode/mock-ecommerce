import { supabase } from "@/lib/supabaseClient";
import { StoreProduct } from "@/types/models";

type SupabaseProductRow = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
  image_url: string;
  stock: number;
  is_default: boolean;
};

export async function getSupabaseProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as SupabaseProductRow[];

  return rows.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: Number(product.price),
    image: product.image_url,
    stock: product.stock,
  }));
}