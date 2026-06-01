import { StoreProduct } from "@/types/models";

export function getEffectiveProductPrice({
  product,
  quantity,
}: {
  product: StoreProduct;
  quantity: number;
}) {
  const groupDealApplies =
    Boolean(product.groupDealEnabled) &&
    Number(product.groupPrice || 0) > 0 &&
    quantity >= Number(product.groupMinQuantity || 2);

  return {
    unitPrice: groupDealApplies ? Number(product.groupPrice) : product.price,
    groupDealApplies,
  };
}

export function hasValidGroupDeal(product: StoreProduct) {
  return (
    Boolean(product.groupDealEnabled) &&
    Number(product.groupPrice || 0) > 0 &&
    Number(product.groupMinQuantity || 2) > 1 &&
    Number(product.groupPrice || 0) < product.price
  );
}