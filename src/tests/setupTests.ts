import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Mock de Firebase ────────────────────────────────────────────────────────
// Los tests NUNCA deben conectarse a Firebase real.
// Mockeamos el módulo completo para evitar el error auth/invalid-api-key.
vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
  storage: {},
  getMessagingInstance: vi.fn().mockResolvedValue(null),
}));

// ─── Mock de window.matchMedia ────────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// ─── Mock de IntersectionObserver ────────────────────────────────────────────
window.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;
