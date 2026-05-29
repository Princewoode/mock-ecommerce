"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { StoreProduct } from "@/types/models";
import { getProductCatalog } from "@/utils/productCatalogService";
import { ghanaMarketplaceCategories } from "@/utils/ghanaMarketplaceCategories";

export default function ProductList() {
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeller, setSelectedSeller] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);

      const products = await getProductCatalog();

      setAllProducts(products);
      setIsLoading(false);
    }

    function applyCategoryFromUrl() {
      if (typeof window === "undefined") {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const category = params.get("category");

      if (category) {
        setSelectedCategory(category);
      }
    }

    applyCategoryFromUrl();
    loadProducts();

    window.addEventListener("productsUpdated", loadProducts);

    return () => {
      window.removeEventListener("productsUpdated", loadProducts);
    };
  }, []);

  const databaseCategories = Array.from(
    new Set(allProducts.map((product) => product.category).filter(Boolean))
  );

  const curatedCategories = ghanaMarketplaceCategories.map(
    (category) => category.name
  );

  const categories = [
    "All",
    ...Array.from(new Set([...curatedCategories, ...databaseCategories])),
  ];

  const sellers = [
    "All",
    ...Array.from(
      new Set(
        allProducts
          .map((product) => product.sellerBusinessName)
          .filter((seller): seller is string => Boolean(seller))
      )
    ),
  ];

  const filteredProducts = useMemo(() => {
    const minPrice = minimumPrice.trim() ? Number(minimumPrice) : null;
    const maxPrice = maximumPrice.trim() ? Number(maximumPrice) : null;

    let result = allProducts.filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.sellerBusinessName || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      const matchesSeller =
        selectedSeller === "All" ||
        product.sellerBusinessName === selectedSeller;

      const matchesMinimumPrice =
        minPrice === null || Number.isNaN(minPrice) || product.price >= minPrice;

      const matchesMaximumPrice =
        maxPrice === null || Number.isNaN(maxPrice) || product.price <= maxPrice;

      const matchesStock = !showInStockOnly || product.stock > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSeller &&
        matchesMinimumPrice &&
        matchesMaximumPrice &&
        matchesStock
      );
    });

    if (sortOrder === "low-to-high") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sortOrder === "high-to-low") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    if (sortOrder === "stock-high") {
      result = [...result].sort((a, b) => b.stock - a.stock);
    }

    if (sortOrder === "newest") {
      result = [...result].sort((a, b) => b.id - a.id);
    }

    return result;
  }, [
    allProducts,
    searchTerm,
    selectedCategory,
    selectedSeller,
    sortOrder,
    minimumPrice,
    maximumPrice,
    showInStockOnly,
  ]);

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedSeller("All");
    setSortOrder("default");
    setMinimumPrice("");
    setMaximumPrice("");
    setShowInStockOnly(false);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/products");
    }
  }

  return (
    <>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Search Ghana Marketplace
            </h2>

            <p className="mt-2 text-gray-600">
              Find products by keyword, category, seller, price, and stock
              availability.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search Products or Sellers
            </label>

            <input
              type="text"
              placeholder="Example: handbag, phone, rice, seller name"
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
              Seller
            </label>

            <select
              value={selectedSeller}
              onChange={(event) => setSelectedSeller(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {sellers.map((seller) => (
                <option key={seller} value={seller}>
                  {seller}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Price GH₵
            </label>

            <input
              type="number"
              placeholder="Example: 50"
              value={minimumPrice}
              onChange={(event) => setMinimumPrice(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Price GH₵
            </label>

            <input
              type="number"
              placeholder="Example: 500"
              value={maximumPrice}
              onChange={(event) => setMaximumPrice(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sort Products
            </label>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="default">Default</option>
              <option value="newest">Newest Listings</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="stock-high">Highest Stock</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex w-full items-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-gray-700">
              <input
                type="checkbox"
                checked={showInStockOnly}
                onChange={(event) => setShowInStockOnly(event.target.checked)}
              />

              <span>In stock only</span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {ghanaMarketplaceCategories.slice(0, 8).map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setSelectedCategory(category.name)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory === category.name
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-gray-600">
            Showing {filteredProducts.length} product
            {filteredProducts.length === 1 ? "" : "s"}
          </p>

          {filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-gray-600">
                No products found. Try another search, category, seller, or
                price range.
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
                  stock={product.stock}
                  sellerId={product.sellerId}
                  sellerBusinessName={product.sellerBusinessName}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}