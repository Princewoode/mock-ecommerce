"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";
import { formatCurrency } from "@/utils/currency";
import { uploadProductImage } from "@/utils/imageUploadService";
import {
  createSellerProduct,
  deleteSellerProduct,
  getSellerProducts,
  SellerProduct,
  updateSellerProduct,
} from "@/utils/sellerProductService";

export default function SellerDashboardContent() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [canManageProducts, setCanManageProducts] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setIsLoading(true);
      setMessage("");

      const sellerProducts = await getSellerProducts();

      setProducts(sellerProducts);
      setCanManageProducts(true);
    } catch (error) {
      setCanManageProducts(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load seller dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setEditingProductId(null);
    setName("");
    setCategory("");
    setDescription("");
    setPrice("");
    setImage("");
    setStock("");
  }

  function validateForm() {
    if (
      !name.trim() ||
      !category.trim() ||
      !description.trim() ||
      !price.trim() ||
      !image.trim() ||
      !stock.trim()
    ) {
      return "Please fill in all product fields and upload or enter an image.";
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return "Please enter a valid Ghana Cedi price.";
    }

    if (
      Number.isNaN(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericStock)
    ) {
      return "Please enter a valid whole-number stock quantity.";
    }

    return "";
  }

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      setMessage("");

      const imageUrl = await uploadProductImage(file);

      setImage(imageUrl);
      setMessage("Image uploaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Image upload failed."
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      const payload = {
        name,
        category,
        description,
        price: Number(price),
        image,
        stock: Number(stock),
      };

      let result;

      if (editingProductId) {
        result = await updateSellerProduct({
          id: editingProductId,
          ...payload,
        });
      } else {
        result = await createSellerProduct(payload);
      }

      setMessage(result.message);
      resetForm();
      await loadProducts();
      window.dispatchEvent(new Event("productsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Product save failed."
      );
    }
  }

  function handleEdit(product: SellerProduct) {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description);
    setPrice(product.price.toString());
    setImage(product.image);
    setStock(product.stock.toString());
    setMessage("");
  }

  async function handleDelete(productId: number) {
    try {
      const result = await deleteSellerProduct(productId);

      setMessage(result.message);
      await loadProducts();
      window.dispatchEvent(new Event("productsUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Product delete failed."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading seller dashboard...</p>
      </div>
    );
  }

  if (!canManageProducts) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-700">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center text-gray-900"
          >
            Login
          </Link>

          <Link
            href="/seller/apply"
            className="rounded-lg bg-black px-6 py-3 text-center text-white"
          >
            Apply as Seller
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingProductId ? "Edit Seller Product" : "Add Seller Product"}
          </h2>

          <p className="mt-2 text-gray-600">
            Upload real product photos and keep prices in Ghana Cedis.
          </p>
        </div>

        {message && (
          <div className="rounded-lg bg-gray-50 p-4 text-gray-700">
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name
          </label>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: Ladies Leather Handbag"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>

          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Example: Fashion"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the product clearly for buyers."
            rows={4}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price in GH₵
            </label>

            <input
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Example: 150"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stock Quantity
            </label>

            <input
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              placeholder="Example: 20"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              handleImageUpload(event.target.files?.[0] || null)
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />

          <p className="mt-2 text-sm text-gray-500">
            Upload a clear product photo. Maximum size: 5MB.
          </p>

          {isUploadingImage && (
            <p className="mt-2 text-sm text-gray-600">Uploading image...</p>
          )}

          {image && (
            <div className="mt-4">
              <ProductVisual image={image} alt={name || "Product image"} />
            </div>
          )}

          <input
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="Or paste image URL / emoji"
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-3 text-white"
          >
            {editingProductId ? "Save Product" : "Add Product"}
          </button>

          {editingProductId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-900"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">My Products</h2>

        <p className="mt-2 text-gray-600">
          These products are listed under your verified seller account.
        </p>

        {products.length === 0 ? (
          <p className="mt-6 text-gray-600">
            You have not added any products yet.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex gap-4">
                  <ProductVisual
                    image={product.image}
                    alt={product.name}
                    size="small"
                  />

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {product.name}
                        </p>

                        <p className="text-gray-600">{product.category}</p>

                        <p className="text-sm text-gray-500">
                          Stock: {product.stock}
                        </p>
                      </div>

                      <p className="font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                    </div>

                    <p className="mt-3 text-gray-600">
                      {product.description}
                    </p>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg border border-red-300 px-4 py-2 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}