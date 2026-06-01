"use client";

import { useState } from "react";
import { CartItem } from "@/types/models";
import { getCartItems, saveCartItems } from "@/utils/cartStorage";

type AddGroupDealButtonProps = {
  productId: number;
  groupMinQuantity: number;
  stock: number;
};

export default function AddGroupDealButton({
  productId,
  groupMinQuantity,
  stock,
}: AddGroupDealButtonProps) {
  const [message, setMessage] = useState("");
  const minimumQuantity = Math.max(groupMinQuantity || 2, 2);
  const canAddGroupDeal = stock >= minimumQuantity;

  function handleAddGroupDeal() {
    if (!canAddGroupDeal) {
      setMessage(`Only ${stock} item(s) available. Group deal cannot be unlocked.`);
      return;
    }

    const cartItems = getCartItems();
    const existingItem = cartItems.find((item) => item.productId === productId);

    let updatedItems: CartItem[];

    if (existingItem) {
      updatedItems = cartItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(item.quantity, minimumQuantity),
            }
          : item
      );
    } else {
      updatedItems = [
        ...cartItems,
        {
          productId,
          quantity: minimumQuantity,
        },
      ];
    }

    saveCartItems(updatedItems);
    window.dispatchEvent(new Event("cartUpdated"));

    setMessage(`Group deal added with ${minimumQuantity} item(s).`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAddGroupDeal}
        disabled={!canAddGroupDeal}
        className="rounded-lg bg-orange-600 px-5 py-2 text-white disabled:bg-gray-300 disabled:text-gray-500"
      >
        Add Group Deal
      </button>

      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}