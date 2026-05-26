export const DEFAULT_PLATFORM_COMMISSION_RATE = 10;

export function calculateCommission({
  price,
  quantity,
  commissionRate = DEFAULT_PLATFORM_COMMISSION_RATE,
}: {
  price: number;
  quantity: number;
  commissionRate?: number;
}) {
  const grossAmount = price * quantity;
  const platformCommissionAmount = (grossAmount * commissionRate) / 100;
  const sellerPayoutAmount = grossAmount - platformCommissionAmount;

  return {
    grossAmount,
    platformCommissionRate: commissionRate,
    platformCommissionAmount,
    sellerPayoutAmount,
  };
}