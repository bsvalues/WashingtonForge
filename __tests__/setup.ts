/**
 * Vitest Test Setup
 *
 * Configures testing environment for React/JSX tests.
 */

import "@testing-library/jest-dom";

// Mock localStorage for tests
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  get length() {
    return Object.keys(this.store).length;
  },
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock window
Object.defineProperty(globalThis, "window", {
  value: {
    ...globalThis.window,
    localStorage: localStorageMock,
  },
  writable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2)}`,
  },
  writable: true,
});
