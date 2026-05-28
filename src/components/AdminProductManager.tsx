"use client";

import { FormEvent, useEffect, useState } from "react";
import ProductVisual from "@/components/ProductVisual";
import {
  AdminProduct,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
} from "@/utils/adminProductApi";
import { formatCurrency } from "@/utils/currency";
import { uploadProductImage } from "@/utils/imageUploadService";

export default function AdminProductManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState("");

  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setIsLoading(true);
      setFormError("");

      const databaseProducts = await getAdminProducts();

      setProducts(databaseProducts);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to load database products."
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
    setFormError("");
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
      return "Please enter a valid product price.";
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
      setFormError("");
      setStatusMessage("");

      const imageUrl = await uploadProductImage(file);

      setImage(imageUrl);
      setStatusMessage("Image uploaded successfully.");
    } catch (error) {
      setFormError(
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
      setFormError(validationMessage);
      return;
    }

    const payload = {
      id: editingProductId || undefined,
      name,
      category,
      description,
      price: Number(price),
      image,
      stock: Number(stock),
    };

    try {
      setFormError("");
      setStatusMessage("");

      if (editingProductId) {
        const result = await updateAdminProduct(payload);
        setStatusMessage(result.message || "Product updated successfully.");
      } else {
        const result = await createAdminProduct(payload);
        setStatusMessage(result.message || "Product created successfully.");
      }

      resetForm();
      await loadProducts();

      window.dispatchEvent(new Event("productsUpdated"));
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Product save failed."
      );
    }
  }

  function handleEdit(product: AdminProduct) {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description);
    setPrice(product.price.toString());
    setImage(product.image);
    setStock(product.stock.toString());
    setFormError("");
    setStatusMessage("");
  }

  async function handleDelete(productId: number) {
    try {
      setFormError("");
      setStatusMessage("");

      const result = await deleteAdminProduct(productId);

      setStatusMessage(result.message || "Product deleted successfully.");

      if (editingProductId === productId) {
        resetForm();
      }

      await loadProducts();

      window.dispatchEvent(new Event("productsUpdated"));
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Product delete failed."
      );
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingProductId ? "Edit Database Product" : "Add Database Product"}
          </h2>

          <p className="mt-2 text-gray-600">
            Manage marketplace products directly in Supabase. Use real product
            images for buyer trust.
          </p>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {formError}
          </div>
        )}

        {statusMessage && (
          <div className="rounded-lg bg-green-50 p-4 text-green-700">
            {statusMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: Wireless Headphones"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>

          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Example: Electronics"
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
            placeholder="Describe the product clearly for Ghanaian buyers"
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
              placeholder="Example: 120.00"
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
              placeholder="Example: 10"
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
            type="text"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="Or paste image URL / emoji"
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-3 text-white"
          >
            {editingProductId ? "Save Changes" : "Add Product"}
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
        <h2 className="text-2xl font-bold text-gray-900">Database Products</h2>

        <p className="mt-2 text-gray-600">
          These products are loaded from Supabase.
        </p>

        {isLoading ? (
          <p className="mt-6 text-gray-600">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="mt-6 text-gray-600">No database products found.</p>
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

                        {product.sellerBusinessName && (
                          <p className="mt-1 text-sm font-medium text-gray-600">
                            Seller: {product.sellerBusinessName}
                          </p>
                        )}

                        {product.isDefault && (
                          <p className="mt-1 text-xs font-semibold text-blue-700">
                            Default product
                          </p>
                        )}
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

                      {!product.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg border border-red-300 px-4 py-2 text-red-600"
                        >
                          Delete
                        </button>
                      )}
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