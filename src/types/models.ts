export type StoreProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
};

export type CartItem = {
  productId: number;
  quantity: number;
};

export type CustomerUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  shippingAddress: string;
};

export type OrderItem = {
  productId: number;
  name: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  customerId?: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  customer: {
    fullName: string;
    email: string;
    shippingAddress: string;
  };
  delivery?: {
    region: string;
    city: string;
    phone: string;
    fee: number;
  };
  fulfillment?: {
    courierName?: string;
    courierPhone?: string;
    trackingCode?: string;
    adminNote?: string;
  };
  items: OrderItem[];
  total: number;
};

export type ProductReview = {
  id: string;
  productId: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type SellerProfile = {
  id: string;
  userId?: string;
  businessName: string;
  ownerName: string;
  phone: string;
  momoNumber: string;
  region: string;
  city: string;
  businessAddress: string;
  productCategories: string;
  status: "Pending" | "Verified" | "Rejected" | "Suspended";
  verificationNote?: string;
  createdAt: string;
};