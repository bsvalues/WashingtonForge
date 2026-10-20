// TerraFusion UUID v4 Generator (shared, client-safe)
//
// A single, spec-compliant UUID v4 generator used by every client-side call
// site that needs a high-entropy id (audit events, ingest runs, roll
// versions, connected feeds, ...).
//
// WHY THREE TIERS
// ----------------
// The live deployment is served over plain HTTP on a Tailscale address
// (http://100.97.194.84:3100). That is NOT a secure context, so:
//
//   - crypto.randomUUID()      → UNDEFINED (secure-context-only)
//   - crypto.subtle             → UNDEFINED (secure-context-only)
//   - crypto.getRandomValues()  → AVAILABLE in ALL contexts, incl. plain HTTP
//
// Relying on randomUUID alone would silently degrade to a
// Date.now()+Math.random() id in production — the exact F6-class bug this
// module exists to eliminate. So we build a real UUID v4 from 16 random bytes
// via getRandomValues whenever randomUUID is unavailable.
//
// This module is pure JS (no node:crypto) so it is safe to import from
// "use client" components and browser bundles.

/**
 * Generate a prefixed, spec-compliant UUID v4.
 *
 * Tiers (first available wins):
 *   1. crypto.randomUUID()        — secure contexts (HTTPS / localhost)
 *   2. crypto.getRandomValues()   — ALL contexts, incl. plain HTTP. This is
 *                                    the path that runs in the live
 *                                    Tailscale-HTTP deployment.
 *   3. Date.now()+Math.random()   — last resort for runtimes with no Web
 *                                    Crypto at all (e.g. very old jsdom).
 *
 * @param prefix Stable namespace prefix (e.g. "audit", "ingest", "rv", "feed").
 * @returns `${prefix}-<uuid>` where `<uuid>` is a real UUID v4 in tiers 1–2.
 */
export function generateUuidId(prefix: string): string {
  const c = globalThis.crypto;

  // 1. Prefer the native UUID v4 (secure contexts: HTTPS / localhost).
  if (c && typeof c.randomUUID === "function") {
    return `${prefix}-${c.randomUUID()}`;
  }

  // 2. crypto.getRandomValues works over plain HTTP too — build a UUID v4 from
  //    16 random bytes, setting the version (4) and variant (10xx) bits per
  //    RFC 4122. This is the path that runs in the live Tailscale-HTTP app.
  if (c && typeof c.getRandomValues === "function") {
    const b = new Uint8Array(16);
    c.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
    const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${prefix}-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // 3. Last-resort fallback for runtimes with no Web Crypto at all.
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
