// Audit trail entries — every meaningful state change (fulfilment status,
// role changes, cancellations, refunds) appends an immutable event. Kept
// optional so records served by a backend without audit support still typecheck.
export interface AuditEvent {
  at: Date;
  actor: string;
  action: string;
  detail?: string;
}

// Two-factor authentication / passkeys
export interface PasskeyCredentialData {
  /** Base64url-encoded COSE public key returned by the authenticator. */
  publicKey: string;
  /** COSE algorithm identifier (e.g. -7 = ES256). */
  publicKeyAlgorithm: number;
  /** Signature counter from the last verified assertion. */
  counter: number;
  /** Authenticator attachment hints reported at registration. */
  transports?: string[];
  /** Authenticator AAGUID (base64url) when provided. */
  aaguid?: string;
}

export interface PasskeyRecord {
  id: string;
  /** Human-readable device label, e.g. "MacBook Pro". */
  name: string;
  createdAt: Date;
  /** Set when the passkey was created through a real WebAuthn ceremony. */
  isWebAuthn?: boolean;
  /** Real credential material for WebAuthn verification (isWebAuthn only). */
  credential?: PasskeyCredentialData;
}

// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  /** Whether the email address has been verified (Firebase email/password accounts). */
  emailVerified: boolean;
  /** TOTP two-factor authentication is enabled. */
  mfaEnabled: boolean;
  mfaEnrolledAt?: Date;
  /** Registered passkeys (demo mode only; Firebase passkeys are a platform beta). */
  passkeys?: PasskeyRecord[];
  history?: AuditEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** Set when sign-in needs a second factor (TOTP code or passkey). */
  pendingMfa?: { email: string; mode: 'totp' | 'passkey'; passkeyAvailable?: boolean } | null;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  thumbnail: string;
  category: 'luxury' | 'sport' | 'casual' | 'smart' | 'classic';
  stock: number;
  rating: number;
  reviewCount: number;
  specifications: {
    movement: string;
    caseDiameter: string;
    caseMaterial: string;
    waterResistance: string;
    strapMaterial: string;
    warranty: string;
  };
  features: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types
export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Order Types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'card' | 'cod' | 'wallet';
  trackingNumber?: string;
  notes?: string;
  /** Chronological audit trail of fulfilment / payment events (oldest first). */
  history?: AuditEvent[];
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: Date;
}

// Wishlist Types
export interface WishlistItem {
  productId: string;
  addedAt: Date;
}

// Filter & Sort Types
export interface ProductFilters {
  category?: string[];
  brand?: string[];
  priceRange?: [number, number];
  rating?: number;
  inStock?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

export type SortOption =
  'newest' | 'price-low' | 'price-high' | 'rating' | 'popular' | 'name-az' | 'name-za';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
