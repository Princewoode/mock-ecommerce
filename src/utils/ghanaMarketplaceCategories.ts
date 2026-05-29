export const ghanaMarketplaceCategories = [
  {
    name: "Fashion",
    description: "Clothing, shoes, bags, watches, accessories, boutiques.",
    examples: ["Dresses", "Sneakers", "Handbags", "Shirts"],
  },
  {
    name: "Phones & Accessories",
    description: "Smartphones, chargers, cases, screen protectors, earbuds.",
    examples: ["iPhone", "Samsung", "Chargers", "Phone cases"],
  },
  {
    name: "Electronics",
    description: "Home electronics, audio devices, gadgets, appliances.",
    examples: ["TVs", "Speakers", "Blenders", "Headphones"],
  },
  {
    name: "Beauty & Personal Care",
    description: "Cosmetics, skincare, hair products, fragrances.",
    examples: ["Wigs", "Perfumes", "Creams", "Makeup"],
  },
  {
    name: "Groceries & Foodstuff",
    description: "Packaged foods, rice, oil, drinks, household food items.",
    examples: ["Rice", "Cooking oil", "Drinks", "Cereals"],
  },
  {
    name: "Home & Kitchen",
    description: "Furniture, kitchenware, home decor, bedding.",
    examples: ["Bedsheets", "Cookware", "Chairs", "Storage boxes"],
  },
  {
    name: "Baby & Kids",
    description: "Baby clothes, toys, school items, child care products.",
    examples: ["Toys", "Baby clothes", "Diapers", "School bags"],
  },
  {
    name: "Wholesale & Bulk Deals",
    description: "Bulk items for retailers, traders, and resellers.",
    examples: ["Wholesale rice", "Bulk clothing", "Cartons", "Market supply"],
  },
  {
    name: "Health & Wellness",
    description: "Non-prescription wellness, fitness, hygiene items.",
    examples: ["Fitness gear", "Sanitizers", "Hygiene products"],
  },
  {
    name: "Local Made in Ghana",
    description: "Products from Ghanaian producers, artisans, and SMEs.",
    examples: ["Kente", "Shea butter", "Local crafts", "African wear"],
  },
];

export function getGhanaCategoryNames() {
  return ghanaMarketplaceCategories.map((category) => category.name);
}