/**
 * DataSuite Browser Storage
 * 
 * Provides localStorage-backed persistence for the DemoRepository.
 * This ensures data survives page reloads and navigation.
 * 
 * For production: replace with Postgres/Supabase calls.
 */

const STORAGE_PREFIX = "datasuite_";
const STORAGE_VERSION = "v1";

// Type-safe storage keys
type StorageKey = 
  | "activePointers"
  | "routeRecords"
  | "countyStatuses"
  | "versions"
  | "lineageEvents"
  | "ingestRuns";

function getKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${STORAGE_VERSION}_${key}`;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: StorageKey, data: T): void {
  if (!isBrowser()) return;
  
  try {
    const serialized = JSON.stringify(data, (_, value) => {
      // Convert Map to array of entries for JSON serialization
      if (value instanceof Map) {
        return {
          __type: "Map",
          entries: Array.from(value.entries()),
        };
      }
      // Convert Set to array
      if (value instanceof Set) {
        return {
          __type: "Set",
          values: Array.from(value),
        };
      }
      return value;
    });
    localStorage.setItem(getKey(key), serialized);
  } catch (error) {
    console.error(`[DataSuite Storage] Failed to save ${key}:`, error);
  }
}

/**
 * Load data from localStorage
 */
export function loadFromStorage<T>(key: StorageKey, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;
  
  try {
    const serialized = localStorage.getItem(getKey(key));
    if (!serialized) return defaultValue;
    
    return JSON.parse(serialized, (_, value) => {
      // Reconstruct Map from serialized format
      if (value && typeof value === "object" && value.__type === "Map") {
        return new Map(value.entries);
      }
      // Reconstruct Set from serialized format
      if (value && typeof value === "object" && value.__type === "Set") {
        return new Set(value.values);
      }
      return value;
    });
  } catch (error) {
    console.error(`[DataSuite Storage] Failed to load ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Clear all DataSuite storage (for testing/reset)
 */
export function clearStorage(): void {
  if (!isBrowser()) return;
  
  const keys: StorageKey[] = [
    "activePointers",
    "routeRecords",
    "countyStatuses",
    "versions",
    "lineageEvents",
    "ingestRuns",
  ];
  
  keys.forEach(key => {
    localStorage.removeItem(getKey(key));
  });
}

/**
 * Check if storage has been initialized
 */
export function hasStorageData(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(getKey("activePointers")) !== null;
}

/**
 * Get storage stats (for debugging)
 */
export function getStorageStats(): {
  initialized: boolean;
  keys: string[];
  totalSize: number;
} {
  if (!isBrowser()) {
    return { initialized: false, keys: [], totalSize: 0 };
  }
  
  const keys: string[] = [];
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
      const value = localStorage.getItem(key);
      totalSize += (key.length + (value?.length || 0)) * 2; // UTF-16
    }
  }
  
  return {
    initialized: hasStorageData(),
    keys,
    totalSize,
  };
}
