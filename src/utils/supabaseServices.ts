import { supabase } from "@/lib/supabaseClient";

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .limit(1);

  if (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }

  return {
    success: true,
    message: "Supabase connection successful.",
    data,
  };
}