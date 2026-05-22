import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type StockItem = {
  productId: number;
  quantity: number;
};

type ProductStockRow = {
  id: number;
  stock: number;
};

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const items = (payload.items || []) as StockItem[];

  const validItems = items.filter(
    (item) =>
      Number.isInteger(item.productId) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  );

  if (validItems.length === 0) {
    return NextResponse.json(
      { message: "No valid stock items provided." },
      { status: 400 }
    );
  }

  const productIds = validItems.map((item) => item.productId);

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, stock")
    .in("id", productIds);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const databaseProducts = (data || []) as ProductStockRow[];

  for (const item of validItems) {
    const product = databaseProducts.find(
      (databaseProduct) => databaseProduct.id === item.productId
    );

    if (!product) {
      continue;
    }

    if (product.stock < item.quantity) {
      return NextResponse.json(
        {
          message: `Product ${item.productId} only has ${product.stock} item(s) left in stock.`,
        },
        { status: 400 }
      );
    }
  }

  for (const item of validItems) {
    const product = databaseProducts.find(
      (databaseProduct) => databaseProduct.id === item.productId
    );

    if (!product) {
      continue;
    }

    const newStock = Math.max(product.stock - item.quantity, 0);

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ stock: newStock })
      .eq("id", item.productId);

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    message: "Database stock updated successfully.",
  });
}