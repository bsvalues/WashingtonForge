/**
 * @/lib/api/types - Type re-exports for backwards compatibility
 *
 * All types are now defined in @/lib/api-internal (barrel exports them).
 * This file re-exports them to maintain import compatibility.
 *
 * NOTE: Imports from barrel only (no deep paths) per ESLint rule.
 */

export * from "@/lib/api-internal";
