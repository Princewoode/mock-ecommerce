import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Order } from "@/types/models";
import { DEFAULT_PLATFORM_COMMISSION_RATE } from "@/utils/commission";

type ProductStockRow = {
  id: number;
  stock: number;
  seller_id: string | null;
  seller_business_name: string | null;
};

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const order = payload.order as Order | undefined;

  if (!order) {
    return NextResponse.json(
      { message: "Missing order data." },
      { status: 400 }
    );
  }

  if (!order.items || order.items.length === 0) {
    return NextResponse.json(
      { message: "Order must contain at least one product." },
      { status: 400 }
    );
  }

  const productIds = order.items.map((item) => item.productId);

  const { data: stockData, error: stockError } = await supabaseAdmin
    .from("products")
    .select("id, stock, seller_id, seller_business_name")
    .in("id", productIds);

  if (stockError) {
    return NextResponse.json({ message: stockError.message }, { status: 500 });
  }

  const databaseProducts = (stockData || []) as ProductStockRow[];

  for (const item of order.items) {
    const product = databaseProducts.find(
      (databaseProduct) => databaseProduct.id === item.productId
    );

    if (!product) {
      return NextResponse.json(
        { message: `${item.name} was not found in the database.` },
        { status: 400 }
      );
    }

    if (product.stock < item.quantity) {
      return NextResponse.json(
        {
          message: `${item.name} only has ${product.stock} item(s) left in stock.`,
        },
        { status: 400 }
      );
    }
  }

  const { data: createdOrder, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_id: order.customerId || null,
      customer_name: order.customer.fullName,
      customer_email: order.customer.email,
      shipping_address: order.customer.shippingAddress,
      delivery_region: order.delivery?.region || null,
      delivery_city: order.delivery?.city || null,
      delivery_phone: order.delivery?.phone || null,
      delivery_fee: order.delivery?.fee || 0,
      courier_name: "",
      courier_phone: "",
      tracking_code: "",
      admin_note: "",
      status: order.status || "Pending Payment",
      payment_method: order.paymentMethod || "Not specified",
      total: order.total,
    })
    .select("*")
    .single();

  if (orderError) {
    return NextResponse.json({ message: orderError.message }, { status: 500 });
  }

  const enrichedOrderItems = order.items.map((item) => {
    const product = databaseProducts.find(
      (databaseProduct) => databaseProduct.id === item.productId
    );

    const grossAmount = item.price * item.quantity;
    const platformCommissionAmount =
      (grossAmount * DEFAULT_PLATFORM_COMMISSION_RATE) / 100;
    const sellerPayoutAmount = grossAmount - platformCommissionAmount;

    return {
      ...item,
      sellerId: product?.seller_id || undefined,
      sellerBusinessName: product?.seller_business_name || "Platform Store",
      platformCommissionRate: DEFAULT_PLATFORM_COMMISSION_RATE,
      platformCommissionAmount,
      sellerPayoutAmount,
    };
  });

  const orderItemsPayload = enrichedOrderItems.map((item) => ({
    order_id: createdOrder.id,
    product_id: item.productId,
    product_name: item.name,
    product_category: item.category,
    product_image: item.image,
    product_price: item.price,
    quantity: item.quantity,
    seller_id: item.sellerId || null,
    seller_business_name: item.sellerBusinessName || "Platform Store",
    platform_commission_rate: item.platformCommissionRate || 0,
    platform_commission_amount: item.platformCommissionAmount || 0,
    seller_payout_amount: item.sellerPayoutAmount || 0,
  }));

  const { error: orderItemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItemsPayload);

  if (orderItemsError) {
    return NextResponse.json(
      { message: orderItemsError.message },
      { status: 500 }
    );
  }

  for (const item of order.items) {
    const product = databaseProducts.find(
      (databaseProduct) => databaseProduct.id === item.productId
    );

    if (!product) {
      continue;
    }

    const newStock = Math.max(product.stock - item.quantity, 0);

    const { error: updateStockError } = await supabaseAdmin
      .from("products")
      .update({ stock: newStock })
      .eq("id", item.productId);

    if (updateStockError) {
      return NextResponse.json(
        { message: updateStockError.message },
        { status: 500 }
      );
    }
  }

  const savedOrder: Order = {
    id: createdOrder.id,
    customerId: createdOrder.customer_id || undefined,
    createdAt: new Date(createdOrder.created_at).toLocaleString(),
    status: createdOrder.status,
    paymentMethod: createdOrder.payment_method,
    customer: {
      fullName: createdOrder.customer_name,
      email: createdOrder.customer_email,
      shippingAddress: createdOrder.shipping_address,
    },
    delivery: {
      region: createdOrder.delivery_region || "",
      city: createdOrder.delivery_city || "",
      phone: createdOrder.delivery_phone || "",
      fee: Number(createdOrder.delivery_fee || 0),
    },
    fulfillment: {
      courierName: createdOrder.courier_name || "",
      courierPhone: createdOrder.courier_phone || "",
      trackingCode: createdOrder.tracking_code || "",
      adminNote: createdOrder.admin_note || "",
    },
    items: enrichedOrderItems,
    total: Number(createdOrder.total),
  };

  return NextResponse.json({
    message: "Order saved to Supabase successfully.",
    order: savedOrder,
  });
}