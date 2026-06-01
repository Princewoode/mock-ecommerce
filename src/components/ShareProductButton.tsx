"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/currency";

type ShareProductButtonProps = {
  productId: number;
  productName: string;
  price: number;
  sellerBusinessName?: string;
  groupDealEnabled?: boolean;
  groupPrice?: number;
  groupMinQuantity?: number;
};

export default function ShareProductButton({
  productId,
  productName,
  price,
  sellerBusinessName,
  groupDealEnabled,
  groupPrice,
  groupMinQuantity = 2,
}: ShareProductButtonProps) {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const hasGroupDeal =
    Boolean(groupDealEnabled) &&
    Number(groupPrice || 0) > 0 &&
    Number(groupPrice) < price;

  function getProductUrl() {
    if (typeof window === "undefined") {
      return `/products/${productId}`;
    }

    return `${window.location.origin}/products/${productId}`;
  }

  function getShareText() {
    const sellerText = sellerBusinessName
      ? `\nSeller: ${sellerBusinessName}`
      : "";

    const priceText = hasGroupDeal
      ? `\nNormal price: ${formatCurrency(price)}\nGroup deal price: ${formatCurrency(
          Number(groupPrice)
        )} when you buy ${groupMinQuantity}+ item(s).`
      : `\nPrice: ${formatCurrency(price)}`;

    return `Check this product on Ghana Marketplace:\n${productName}${sellerText}${priceText}\n\n${getProductUrl()}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getProductUrl());
      setMessage("Link copied.");
      setIsOpen(false);
    } catch {
      setMessage("Could not copy link.");
    }
  }

  function handleWhatsAppShare() {
    const shareText = encodeURIComponent(getShareText());
    const whatsappUrl = `https://wa.me/?text=${shareText}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        Share
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="block w-full px-4 py-3 text-left text-sm font-semibold text-green-700 hover:bg-green-50"
          >
            Share on WhatsApp
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="block w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Copy Link
          </button>
        </div>
      )}

      {message && <p className="mt-2 text-xs text-gray-500">{message}</p>}
    </div>
  );
}