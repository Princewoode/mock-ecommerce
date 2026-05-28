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
  seller_id: string | null;
  seller_business_name: string | null;
  product_status: "Pending Review" | "Approved" | "Rejected" | "Suspended" | null;
  admin_product_note: string | null;
};

export async function getSupabaseProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or("product_status.eq.Approved,product_status.is.null")
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
    sellerId: product.seller_id || undefined,
    sellerBusinessName: product.seller_business_name || undefined,
    productStatus: product.product_status || "Approved",
    adminProductNote: product.admin_product_note || "",
  }));
}