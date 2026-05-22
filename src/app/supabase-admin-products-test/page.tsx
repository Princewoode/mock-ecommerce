"use client";

import { FormEvent, useState } from "react";

type AdminProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  isDefault: boolean;
};

export default function SupabaseAdminProductsTestPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("Database Test Product");
  const [category, setCategory] = useState("Test");
  const [description, setDescription] = useState(
    "A test product created through the secure admin API."
  );
  const [price, setPrice] = useState("19.99");
  const [image, setImage] = useState("🧪");
  const [stock, setStock] = useState("10");

  async function loadProducts() {
    setMessage("");

    const response = await fetch("/api/admin/products", {
      headers: {
        "x-admin-password": adminPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || "Failed to load products.");
      return;
    }

    setProducts(result.products || []);
    setMessage("Products loaded from secure admin API.");
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        name,
        category,
        description,
        price,
        image,
        stock,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || "Failed to create product.");
      return;
    }

    setMessage(result.message);
    await loadProducts();
  }

  async function handleDeleteProduct(productId: number) {
    setMessage("");

    const response = await fetch(`/api/admin/products?id=${productId}`, {
      method: "DELETE",
      headers: {
        "x-admin-password": adminPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || "Failed to delete product.");
      return;
    }

    setMessage(result.message);
    await loadProducts();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Supabase Admin API Test
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Admin Product Writes
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            This page tests secure product creation and deletion through a
            server-side API route.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700">
            Admin API Password
          </label>

          <input
            type="password"
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            placeholder="Enter admin API password"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />

          <button
            type="button"
            onClick={loadProducts}
            className="mt-4 rounded-lg bg-black px-6 py-3 text-white"
          >
            Load Products
          </button>

          {message && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
              {message}
            </div>
          )}
        </div>

        <form
          onSubmit={handleCreateProduct}
          className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            Create Database Product
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>

              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image Path or Emoji
              </label>

              <input
                value={image}
                onChange={(event) => setImage(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stock
              </label>

              <input
                type="number"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-3 text-white"
          >
            Create Product in Supabase
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-gray-600">{product.category}</p>
                  <p className="mt-1 text-gray-600">
                    Stock: {product.stock}
                  </p>
                  <p className="mt-1 font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </p>
                </div>

                {!product.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="rounded-lg border border-red-300 px-5 py-2 text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="mt-4 text-gray-700">{product.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}