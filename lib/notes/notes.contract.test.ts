/**
 * Parcel Notes Contract Tests
 *
 * Proves the first persisted, non-fixture workflow is real:
 * 1. POST upserts (create then update same parcel, no duplicate)
 * 2. GET returns the persisted note across a fresh read (simulates reload)
 * 3. Invalid payloads are rejected with a 400-class result
 * 4. Over-length notes are rejected
 *
 * Run: pnpm test lib/notes/notes.contract.test.ts
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { getNotesForParcel, upsertNote, validateNotePayload, MAX_NOTE_LENGTH } from "./store";

const TEST_FILE = path.join(os.tmpdir(), `wf-notes-test-${process.pid}.json`);
const PARCEL = "53005-000123";

afterEach(async () => {
  await fs.rm(TEST_FILE, { force: true });
});

describe("Parcel Notes Contract", () => {
  it("creates then upserts the same parcel without duplicating", async () => {
    await upsertNote(PARCEL, "first note", TEST_FILE);
    await upsertNote(PARCEL, "revised note", TEST_FILE);

    const notes = await getNotesForParcel(PARCEL, TEST_FILE);
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe("revised note");
    expect(notes[0].createdAt).toBeDefined();
    expect(notes[0].updatedAt).toBeDefined();
  });

  it("persists across a fresh read (reload semantics)", async () => {
    const saved = await upsertNote(PARCEL, "persisted text", TEST_FILE);
    // Fresh read from disk — no in-memory state carried over
    const notes = await getNotesForParcel(PARCEL, TEST_FILE);
    expect(notes[0].id).toBe(saved.id);
    expect(notes[0].text).toBe("persisted text");
  });

  it("keeps notes for different parcels isolated", async () => {
    await upsertNote(PARCEL, "parcel A", TEST_FILE);
    await upsertNote("53005-999999", "parcel B", TEST_FILE);

    const a = await getNotesForParcel(PARCEL, TEST_FILE);
    const b = await getNotesForParcel("53005-999999", TEST_FILE);
    expect(a[0].text).toBe("parcel A");
    expect(b[0].text).toBe("parcel B");
  });

  it("returns empty for an unknown parcel", async () => {
    const notes = await getNotesForParcel("does-not-exist", TEST_FILE);
    expect(notes).toEqual([]);
  });

  describe("validateNotePayload", () => {
    it("accepts a valid payload", () => {
      const r = validateNotePayload({ parcelId: PARCEL, text: "hello" });
      expect(r.ok).toBe(true);
    });

    it("rejects a missing parcelId", () => {
      const r = validateNotePayload({ text: "hello" });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects a blank parcelId", () => {
      const r = validateNotePayload({ parcelId: "   ", text: "hello" });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects a non-string text", () => {
      const r = validateNotePayload({ parcelId: PARCEL, text: 42 });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects a non-object body", () => {
      const r = validateNotePayload("nope");
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("rejects over-length text", () => {
      const r = validateNotePayload({
        parcelId: PARCEL,
        text: "x".repeat(MAX_NOTE_LENGTH + 1),
      });
      expect(r).toMatchObject({ ok: false, status: 400 });
    });

    it("accepts text at exactly the limit", () => {
      const r = validateNotePayload({
        parcelId: PARCEL,
        text: "x".repeat(MAX_NOTE_LENGTH),
      });
      expect(r.ok).toBe(true);
    });
  });
});
