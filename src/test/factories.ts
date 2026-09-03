import type { Product, User } from '@/types';

export const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1',
  name: 'Classic Diver',
  brand: 'Aurum',
  model: 'AD-100',
  description: 'A versatile luxury diver watch.',
  price: 1200,
  originalPrice: 1500,
  discount: 20,
  images: [],
  thumbnail: '',
  category: 'luxury',
  stock: 5,
  rating: 4.5,
  reviewCount: 3,
  specifications: {
    movement: 'Automatic',
    caseDiameter: '41mm',
    caseMaterial: 'Steel',
    waterResistance: '300m',
    strapMaterial: 'Steel',
    warranty: '2 years',
  },
  features: ['Sapphire crystal'],
  isNew: true,
  isFeatured: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  photoURL: undefined,
  role: 'user',
  emailVerified: true,
  mfaEnabled: false,
  passkeys: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

/** Flushes pending promises and microtasks (used after mocked async flows). */
export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
