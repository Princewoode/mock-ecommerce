export type StoreProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  sellerId?: string;
  sellerBusinessName?: string;
  productStatus?: "Pending Review" | "Approved" | "Rejected" | "Suspended";
  adminProductNote?: string;
  groupDealEnabled?: boolean;
  groupPrice?: number;
  groupMinQuantity?: number;
  groupDealNote?: string;
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
  sellerId?: string;
  sellerBusinessName?: string;
  platformCommissionRate?: number;
  platformCommissionAmount?: number;
  sellerPayoutAmount?: number;
  sellerFulfillmentStatus?: string;
sellerReadyAt?: string;
sellerFulfillmentNote?: string;
};

export type Order = {
  id: string;
  customerId?: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  payment?: {
    status: string;
    phone?: string;
    reference?: string;
    note?: string;
    confirmedAt?: string;
    escrowStatus?: string;
  };
  customerAction?: {
    deliveryConfirmedAt?: string;
    refundStatus?: string;
    refundReason?: string;
    refundRequestedAt?: string;
    disputeStatus?: string;
    disputeReason?: string;
    disputeRequestedAt?: string;
  };
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
  storeDescription?: string;
  logoUrl?: string;
  bannerUrl?: string;
  createdAt: string;
};

export type SellerTrustStats = {
  averageRating: number;
  reviewCount: number;
  approvedProductCount: number;
  totalSellerOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  trustScore: number;
  trustLabel:
    | "New Seller"
    | "Trusted Seller"
    | "Top Trusted Seller"
    | "Needs Review";
};

export type AppNotification = {
  id: string;
  audience: "customer" | "seller" | "admin";
  userId?: string;
  sellerId?: string;
  title: string;
  message: string;
  type: string;
  relatedOrderId?: string;
  relatedProductId?: number;
  isRead: boolean;
  createdAt: string;
};
export type DeliveryDriverProfile = {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  platformPhone?: string;
  momoNumber: string;
  region: string;
  city: string;
  vehicleType: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  ghanaCardReference?: string;
  intraCityZones?: string;
  interCityRoutes?: string;
  availability?: string;
  emergencyContact?: string;
  driverNote?: string;
  status: "Pending" | "Verified" | "Rejected" | "Suspended";
  verificationNote?: string;
  createdAt: string;
    baseLat?: number;
  baseLng?: number;
  currentLat?: number;
  currentLng?: number;
  lastLocationNote?: string;
  lastLocationAt?: string;
    currentAccuracyMeters?: number;
};
export type DeliveryAssignment = {
  id: string;
  orderId: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlatformPhone?: string;
  driverVehicleType?: string;
  driverVehicleNumber?: string;
  assignmentType: string;
  assignmentStatus: string;
  pickupRegion?: string;
  pickupCity?: string;
  dropoffRegion?: string;
  dropoffCity?: string;
  routeNote?: string;
  adminNote?: string;
  assignedAt: string;
  updatedAt?: string;
    pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  currentLat?: number;
  currentLng?: number;
  currentLocationNote?: string;
    currentAccuracyMeters?: number;
  lastLocationAt?: string;
    originHubId?: string;
  originHubName?: string;
  destinationHubId?: string;
  destinationHubName?: string;
  legSequence?: number;
  handoverStatus?: string;
  handoverNote?: string;
  handedOverAt?: string;
};

export type DeliveryTrackingEvent = {
  id: string;
  orderId: string;
  assignmentId?: string;
  driverId?: string;
  eventTitle: string;
  eventMessage: string;
  eventStatus: string;
  locationNote?: string;
  createdAt: string;
    latitude?: number;
  longitude?: number;
};
export type DeliveryMessage = {
  id: string;
  orderId: string;
  assignmentId?: string;
  senderRole: "customer" | "driver" | "admin";
  senderName: string;
  senderUserId?: string;
  senderDriverId?: string;
  message: string;
  isInternal?: boolean;
  createdAt: string;
};
export type DeliveryRoute = {
  id: string;
  routeName: string;
  routeType: "Intra-city" | "Inter-city" | "Seller Pickup" | "Final Mile";
  originRegion?: string;
  originCity?: string;
  destinationRegion?: string;
  destinationCity?: string;
  routeZones?: string;
  estimatedDeliveryFee?: number;
  estimatedTransitTime?: string;
  isActive: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
    originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
};
export type DeliveryHub = {
  id: string;
  hubName: string;
  hubType:
    | "Cross-Dock"
    | "Fulfillment Centre"
    | "Inter-city Transfer"
    | "Final Mile Station";
  region: string;
  city: string;
  address?: string;
  contactPhone?: string;
  managerName?: string;
  managerPhone?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  isActive: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
};

export type DeliveryHandoverEvent = {
  id: string;
  orderId: string;
  fromAssignmentId?: string;
  toAssignmentId?: string;
  hubId?: string;
  hubName?: string;
  eventType: string;
  eventNote?: string;
  createdByRole: "admin" | "driver" | "hub_staff";
  createdByName?: string;
  createdAt: string;
};