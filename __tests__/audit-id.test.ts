/**
 * Audit Event ID Tests (F6-class fix)
 *
 * emitAuditEvent() previously built its entry id from
 * `Date.now()` + `Math.random()`, the same non-crypto ID pattern that F6
 * already fixed in lib/wa-data/client.ts. Two events emitted in the same
 * millisecond could collide, and the id was not a real UUID.
 *
 * This pins the new behavior: ids carry the `audit-` prefix, are unique
 * across many events, are distinct even when emitted in the same
 * millisecond, and the entry is stored/retrievable by its id.
 *
 * Note: the test environment mocks crypto.randomUUID (see __tests__/setup.ts),
 * so the crypto.randomUUID path is exercised here. The Date.now()+random
 * fallback is the identical, already-proven F6 pattern and is exercised in
 * the real app over non-secure HTTP where crypto.randomUUID is unavailable.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  emitAuditEvent,
  setAuditContext,
  clearAuditContext,
  getAuditEvents,
} from "@/lib/audit";

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