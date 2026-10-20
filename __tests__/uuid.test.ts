/**
 * Shared UUID v4 Generator Tests (F6 parity)
 *
 * lib/uuid.ts is the single source of truth for client-side id generation.
 * Both lib/audit/index.ts (audit event ids) and lib/wa-data/client.ts
 * (ingest runs, roll versions, connected feeds) delegate to it, so a bug in
 * the generator would silently degrade ids in every one of those call sites.
 *
 * The generator has three tiers:
 *   1. crypto.randomUUID()        — secure contexts (HTTPS / localhost)
 *   2. crypto.getRandomValues()   — ALL contexts, incl. plain HTTP. This is
 *                                    the path that runs in the live
 *                                    Tailscale-HTTP deployment, where
 *                                    randomUUID is undefined.
 *   3. Date.now()+Math.random()   — last resort, no Web Crypto at all.
 *
 * This pins the behavior across all three tiers: the prefix is preserved,
 * ids are unique across many calls, ids are distinct even when generated in
 * the same millisecond, and — critically — the getRandomValues tier produces
 * a spec-compliant UUID v4 (version nibble 4, variant nibble 8/9/a/b).
 *
 * Note: the test environment mocks crypto.randomUUID (see __tests__/setup.ts),
 * so the first describe block exercises tier 1. The second block swaps in a
 * crypto object exposing only getRandomValues (no randomUUID) to exercise
 * tier 2 — the exact condition of the live deployment. The third block
 * removes crypto entirely to exercise tier 3.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateUuidId } from "@/lib/uuid";

// A spec-compliant UUID v4: 8-4-4-4-12 hex, version nibble "4", variant
// nibble one of 8/9/a/b.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuidId — randomUUID tier (secure contexts)", () => {
  // setup.ts mocks crypto.randomUUID, so this block exercises tier 1.

  it("preserves the prefix", () => {
    expect(generateUuidId("audit")).toMatch(/^audit-/);
    expect(generateUuidId("ingest")).toMatch(/^ingest-/);
    expect(generateUuidId("rv")).toMatch(/^rv-/);
    expect(generateUuidId("feed")).toMatch(/^feed-/);
  });

  it("generates unique ids across many calls (no collisions)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateUuidId("audit"));
    }
    expect(ids.size).toBe(100);
  });

  it("assigns distinct ids to calls in the same millisecond", () => {
    const a = generateUuidId("ingest");
    const b = generateUuidId("ingest");
    expect(a).not.toBe(b);
  });
});

describe("generateUuidId — getRandomValues tier (live Tailscale-HTTP path)", () => {
  // In the real deployment over plain HTTP, crypto.randomUUID is UNDEFINED
  // (secure-context-only) but crypto.getRandomValues IS available. Swap in a
  // crypto object that exposes only getRandomValues to exercise that exact
  // condition, then restore the setup.ts mock afterwards.
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    // No randomUUID — only getRandomValues, mirroring the live HTTP context.
    globalThis.crypto = {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    } as unknown as Crypto;
  });

  afterEach(() => {
    globalThis.crypto = originalCrypto;
  });

  it("produces a spec-compliant UUID v4 (version 4, variant 8/9/a/b)", () => {
    const id = generateUuidId("audit");
    // Strip the prefix, then validate the UUID v4 shape.
    const uuid = id.slice("audit-".length);
    expect(uuid).toMatch(UUID_V4);
  });

  it("produces a spec-compliant UUID v4 for every call-site prefix", () => {
    for (const prefix of ["ingest", "rv", "feed"]) {
      const uuid = generateUuidId(prefix).slice(`${prefix}-`.length);
      expect(uuid).toMatch(UUID_V4);
    }
  });

  it("generates unique ids across many calls (no collisions)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateUuidId("ingest"));
    }
    expect(ids.size).toBe(100);
  });

  it("assigns distinct ids to calls in the same millisecond", () => {
    const a = generateUuidId("rv");
    const b = generateUuidId("rv");
    expect(a).not.toBe(b);
  });
});

describe("generateUuidId — no-crypto fallback tier", () => {
  // Some runtimes (very old jsdom, minimal workers) expose no Web Crypto at
  // all. The generator must still return a prefixed, unique id rather than
  // throwing.
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    // Remove crypto entirely to force tier 3.
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    globalThis.crypto = originalCrypto;
  });

  it("still returns a prefixed id", () => {
    expect(generateUuidId("audit")).toMatch(/^audit-/);
  });

  it("generates unique ids across many calls (no collisions)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(generateUuidId("feed"));
    }
    expect(ids.size).toBe(50);
  });
});
