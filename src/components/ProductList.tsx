"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getAllProducts, StoreProduct } from "@/utils/productStorage";

export default function ProductList() {
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");

  useEffect(() => {
    function loadProducts() {
      setAllProducts(getAllProducts());
    }

    loadProducts();

    window.addEventListener("productsUpdated", loadProducts);

    return () => {
      window.removeEventListener("productsUpdated", loadProducts);
    };
  }, []);

  const categories = [
    "All",
    ...new Set(allProducts.map((product) => product.category)),
  ];

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    if (sortOrder === "low-to-high") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sortOrder === "high-to-low") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [allProducts, searchTerm, selectedCategory, sortOrder]);

  return (
    <>
      <div className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search Products
          </label>

          <input
            type="text"
            placeholder="Search by name or description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sort by Price
          </label>

          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="default">Default</option>
            <option value="low-to-high">Low to High</option>
            <option value="high-to-low">High to Low</option>
          </select>
        </div>
      </div>

      <p className="mt-6 text-gray-600">
        Showing {filteredProducts.length} product
        {filteredProducts.length === 1 ? "" : "s"}
      </p>

      {filteredProducts.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">
            No products found. Try another search or category.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              category={product.category}
              description={product.description}
              price={product.price}
              image={product.image}
            />
          ))}
        </div>
      )}
    </>
  );
}