"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  clearCustomProducts,
  getCustomProducts,
  getDefaultProductsWithStock,
  saveCustomProducts,
  StoreProduct,
} from "@/utils/productStorage";

export default function AdminProductManager() {
  const [customProducts, setCustomProducts] = useState<StoreProduct[]>([]);
  const [defaultProducts, setDefaultProducts] = useState<StoreProduct[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
  function loadProducts() {
    setCustomProducts(getCustomProducts());
    setDefaultProducts(getDefaultProductsWithStock());
  }

  loadProducts();

  window.addEventListener("productsUpdated", loadProducts);

  return () => {
    window.removeEventListener("productsUpdated", loadProducts);
  };
}, []);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !name.trim() ||
      !category.trim() ||
      !description.trim() ||
      !price.trim() ||
      !image.trim() ||
      !stock.trim()
    ) {
      setFormError("Please fill in all product fields.");
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setFormError("Please enter a valid product price.");
      return;
    }

    if (
      Number.isNaN(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericStock)
    ) {
      setFormError("Please enter a valid whole-number stock quantity.");
      return;
    }

    let updatedProducts: StoreProduct[];

    if (editingProductId) {
      updatedProducts = customProducts.map((product) =>
        product.id === editingProductId
          ? {
              ...product,
              name,
              category,
              description,
              price: numericPrice,
              image,
              stock: numericStock,
            }
          : product
      );
    } else {
      const newProduct: StoreProduct = {
        id: Date.now(),
        name,
        category,
        description,
        price: numericPrice,
        image,
        stock: numericStock,
      };

      updatedProducts = [newProduct, ...customProducts];
    }

    setCustomProducts(updatedProducts);
    saveCustomProducts(updatedProducts);
    resetForm();
  }

  function handleEdit(product: StoreProduct) {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description);
    setPrice(product.price.toString());
    setImage(product.image);
    setStock(product.stock.toString());
    setFormError("");
  }

  function handleDelete(productId: number) {
    const updatedProducts = customProducts.filter(
      (product) => product.id !== productId
    );

    setCustomProducts(updatedProducts);
    saveCustomProducts(updatedProducts);

    if (editingProductId === productId) {
      resetForm();
    }
  }

  function handleResetCustomProducts() {
    clearCustomProducts();
    setCustomProducts([]);
    resetForm();
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingProductId ? "Edit Product" : "Add Product"}
          </h2>

          <p className="mt-2 text-gray-600">
            Add custom products with stock quantity to your mock store.
          </p>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {formError}
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
            placeholder="Describe the product"
            rows={4}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>

            <input
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Example: 49.99"
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
            Image Path or Emoji
          </label>

          <input
            type="text"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="Example: 🎧 or /products/headphones.jpg"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
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

      <div className="space-y-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Default Products
          </h2>

          <p className="mt-2 text-gray-600">
            These products are built into the project and are read-only.
          </p>

          <div className="mt-6 space-y-4">
            {defaultProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
              >
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
                  ${product.price.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Custom Products
              </h2>

              <p className="mt-2 text-gray-600">
                These products are saved in your browser.
              </p>
            </div>

            {customProducts.length > 0 && (
              <button
                type="button"
                onClick={handleResetCustomProducts}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              >
                Reset
              </button>
            )}
          </div>

          {customProducts.length === 0 ? (
            <p className="mt-6 text-gray-600">
              No custom products added yet.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {customProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
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
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  <p className="mt-3 text-gray-600">{product.description}</p>

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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}