/**
 * Audit Event ID Tests (F6-class fix)
 *
 * emitAuditEvent() previously built its entry id from
 * `Date.now()` + `Math.random()`, the same non-crypto ID pattern that F6
 * already fixed in lib/wa-data/client.ts. Two events emitted in the same
 * millisecond could collide, and the id was not a real UUID.
 *
 * generateAuditId() now has three tiers:
 *   1. crypto.randomUUID()        — secure contexts (HTTPS / localhost)
 *   2. crypto.getRandomValues()   — ALL contexts, incl. plain HTTP. This is
 *                                    the path that runs in the live
 *                                    Tailscale-HTTP deployment, where
 *                                    randomUUID is undefined.
 *   3. Date.now()+Math.random()   — last resort, no Web Crypto at all.
 *
 * This pins the behavior across the tiers: ids carry the `audit-` prefix,
 * are unique across many events, are distinct even when emitted in the same
 * millisecond, the entry is stored/retrievable by its id, and — critically —
 * the getRandomValues tier produces a spec-compliant UUID v4 (version nibble
 * 4, variant nibble 8/9/a/b).
 *
 * Note: the test environment mocks crypto.randomUUID (see __tests__/setup.ts),
 * so the first describe block exercises tier 1. The second block swaps in a
 * crypto object exposing only getRandomValues (no randomUUID) to exercise
 * tier 2 — the exact condition of the live deployment.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { emitAuditEvent, setAuditContext, clearAuditContext, getAuditEvents } from "@/lib/audit";

// A spec-compliant UUID v4: 8-4-4-4-12 hex, version nibble "4", variant
// nibble one of 8/9/a/b.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("audit event id (F6-class: crypto.randomUUID)", () => {
  beforeEach(() => {
    setAuditContext({ userId: "u1", userName: "Test User", countyId: "53005" });
  });

  afterEach(() => {
    clearAuditContext();
  });

  it("generates an id with the audit- prefix", () => {
    const entry = emitAuditEvent({
      action: "login",
      resourceType: "session",
      resourceId: "s1",
    });
    expect(entry.id).toMatch(/^audit-/);
  });

  it("generates unique ids across many events (no collisions)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const entry = emitAuditEvent({
        action: "cockpit_view",
        resourceType: "cockpit",
        resourceId: "c1",
      });
      ids.add(entry.id);
    }
    expect(ids.size).toBe(50);
  });

  it("assigns distinct ids to events emitted in the same millisecond", () => {
    const a = emitAuditEvent({
      action: "login",
      resourceType: "session",
      resourceId: "s1",
    });
    const b = emitAuditEvent({
      action: "logout",
      resourceType: "session",
      resourceId: "s1",
    });
    expect(a.id).not.toBe(b.id);
  });

  it("stores the entry with its id and it is retrievable", () => {
    const entry = emitAuditEvent({
      action: "login",
      resourceType: "session",
      resourceId: "s1",
    });
    const stored = getAuditEvents(50).find((e) => e.id === entry.id);
    expect(stored).toBeDefined();
    expect(stored?.action).toBe("login");
  });
});

describe("audit event id — getRandomValues tier (live Tailscale-HTTP path)", () => {
  // In the real deployment over plain HTTP, crypto.randomUUID is UNDEFINED
  // (secure-context-only) but crypto.getRandomValues IS available. Swap in a
  // crypto object that exposes only getRandomValues to exercise that exact
  // condition, then restore the setup.ts mock afterwards.
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    setAuditContext({ userId: "u1", userName: "Test User", countyId: "53005" });
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
    clearAuditContext();
    globalThis.crypto = originalCrypto;
  });

  it("produces a spec-compliant UUID v4 (version 4, variant 8/9/a/b)", () => {
    const entry = emitAuditEvent({
      action: "login",
      resourceType: "session",
      resourceId: "s1",
    });
    // Strip the audit- prefix, then validate the UUID v4 shape.
    const uuid = entry.id.replace(/^audit-/, "");
    expect(uuid).toMatch(UUID_V4);
  });

  it("generates unique UUID v4 ids across many events (no collisions)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const entry = emitAuditEvent({
        action: "cockpit_view",
        resourceType: "cockpit",
        resourceId: "c1",
      });
      ids.add(entry.id);
    }
    expect(ids.size).toBe(100);
  });

  it("assigns distinct ids to events emitted in the same millisecond", () => {
    const a = emitAuditEvent({
      action: "login",
      resourceType: "session",
      resourceId: "s1",
    });
    const b = emitAuditEvent({
      action: "logout",
      resourceType: "session",
      resourceId: "s1",
    });
    expect(a.id).not.toBe(b.id);
  });
});
