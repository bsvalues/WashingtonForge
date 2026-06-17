/**
 * Parcel Review Status Contract Tests
 *
 * Proves the second persisted, non-fixture workflow is real:
 * 1. Setting status persists and reads back (reload semantics)
 * 2. Transitions append to history with from/to
 * 3. Parcels are isolated
 * 4. Unknown parcel returns the synthetic default (unreviewed, empty history)
 * 5. Invalid payloads (parcelId, status enum, note length, malformed body) are rejected
 *
 * Run: pnpm test lib/review-status/review-status.contract.test.ts
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import {
  getReviewRecord,
  setReviewStatus,
  validateReviewPayload,
  MAX_CHANGE_NOTE_LENGTH,
} from "./store";

const TEST_FILE = path.join(os.tmpdir(), `wf-review-test-${process.pid}.json`);
const PARCEL = "53005-000123";

afterEach(async () => {
  await fs.rm(TEST_FILE, { force: true });
});

describe("Parcel Review Status Contract", () => {
  it("persists a status across a fresh read (reload semantics)", async () => {
    await setReviewStatus(PARCEL, "in_review", "started review", undefined, TEST_FILE);
    const record = await getReviewRecord(PARCEL, TEST_FILE);
    expect(record.status).toBe("in_review");
    expect(record.changeNote).toBe("started review");
    expect(record.updatedAt).toBeDefined();
  });

  it("appends a transition to history on each change", async () => {
    await setReviewStatus(PARCEL, "in_review", undefined, undefined, TEST_FILE);
    await setReviewStatus(PARCEL, "needs_followup", "missing photos", undefined, TEST_FILE);
    await setReviewStatus(PARCEL, "reviewed", "resolved", undefined, TEST_FILE);

    const record = await getReviewRecord(PARCEL, TEST_FILE);
    expect(record.status).toBe("reviewed");
    expect(record.history).toHaveLength(3);

    // First transition has no prior status (undefined `from` is dropped by JSON serialization).
    expect(record.history[0].from).toBeUndefined();
    expect(record.history[0].to).toBe("in_review");
    expect(record.history[1]).toMatchObject({ from: "in_review", to: "needs_followup", note: "missing photos" });
    expect(record.history[2]).toMatchObject({ from: "needs_followup", to: "reviewed", note: "resolved" });
  });

  it("keeps records for different parcels isolated", async () => {
    await setReviewStatus(PARCEL, "reviewed", undefined, undefined, TEST_FILE);
    await setReviewStatus("53005-999999", "needs_followup", undefined, undefined, TEST_FILE);

    const a = await getReviewRecord(PARCEL, TEST_FILE);
    const b = await getReviewRecord("53005-999999", TEST_FILE);
    expect(a.status).toBe("reviewed");
    expect(b.status).toBe("needs_followup");
  });

  it("returns the synthetic default for an unknown parcel", async () => {
    const record = await getReviewRecord("does-not-exist", TEST_FILE);
    expect(record.status).toBe("unreviewed");
    expect(record.history).toEqual([]);
  });

  describe("validateReviewPayload", () => {
    it("accepts a valid payload", () => {
      const r = validateReviewPayload({ parcelId: PARCEL, status: "reviewed", note: "ok" });
      expect(r.ok).toBe(true);
    });

    it("accepts a payload without a note", () => {
      const r = validateReviewPayload({ parcelId: PARCEL, status: "in_review" });
      expect(r.ok).toBe(true);
    });

    it("rejects a missing parcelId", () => {
      const r = validateReviewPayload({ status: "reviewed" });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects a status outside the enum", () => {
      const r = validateReviewPayload({ parcelId: PARCEL, status: "approved" });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects a non-object body", () => {
      const r = validateReviewPayload(null);
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects a non-string note", () => {
      const r = validateReviewPayload({ parcelId: PARCEL, status: "reviewed", note: 42 });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects an over-length note", () => {
      const r = validateReviewPayload({
        parcelId: PARCEL,
        status: "reviewed",
        note: "x".repeat(MAX_CHANGE_NOTE_LENGTH + 1),
      });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });
  });
});
