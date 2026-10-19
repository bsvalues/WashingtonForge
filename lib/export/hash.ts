/**
 * Court-ready export hashing.
 *
 * Pure, framework-agnostic helpers that compute REAL SHA-256 digests using
 * Node's built-in crypto. Extracted from the court-packet route so the
 * hashing is independently unit-testable (known-answer tests) and reusable.
 */

import { createHash } from "node:crypto";

/**
 * Compute a real SHA-256 digest of the input string, returned as lowercase hex.
 * Deterministic and independently verifiable.
 */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Compute the cryptographic package hash for a court-ready export.
 *
 * Real SHA-256 over the canonical request payload plus the generation
 * timestamp, so the hash is reproducible given (payload, timestamp) and can
 * be independently recomputed to verify the package was not altered.
 */
export function generatePackageHash<T extends object>(
  data: T,
  timestamp: string,
): string {
  const input = JSON.stringify({ ...data, timestamp });
  return `sha256:${sha256Hex(input)}`;
}

/**
 * Compute the assessor's signature hash over a package.
 *
 * A genuine SHA-256 over the package hash, the certifier identity, and the
 * certification time — binding the signature to both the package and the
 * certifier, rather than an arbitrary slice of the package hash.
 */
export function generateSignatureHash(
  packageHash: string,
  certifiedBy: string,
  certifiedAt: string,
): string {
  return `sig:${sha256Hex(`${packageHash}|${certifiedBy}|${certifiedAt}`)}`;
}