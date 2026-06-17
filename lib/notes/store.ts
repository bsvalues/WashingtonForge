/**
 * Parcel notes store — file-backed, single-process local persistence.
 *
 * This is local server storage, NOT an enterprise-durable datastore.
 * One note per parcel (upsert semantics). Writes are atomic (temp + rename)
 * so a crash mid-write cannot corrupt the store.
 */
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { MAX_NOTE_LENGTH } from "./constants";

export { MAX_NOTE_LENGTH };

export const DEFAULT_NOTES_FILE = path.join(process.cwd(), "data", "notes.json");

export interface ParcelNote {
  id: string;
  parcelId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesStore {
  notes: ParcelNote[];
}

export type ValidationResult =
  | { ok: true; parcelId: string; text: string }
  | { ok: false; status: number; error: string };

/** Validate an incoming POST payload. Pure — no I/O. */
export function validateNotePayload(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, error: "request body must be an object" };
  }
  const { parcelId, text } = body as { parcelId?: unknown; text?: unknown };

  if (typeof parcelId !== "string" || parcelId.trim() === "") {
    return { ok: false, status: 400, error: "parcelId is required" };
  }
  if (typeof text !== "string") {
    return { ok: false, status: 400, error: "text must be a string" };
  }
  if (text.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: `text exceeds ${MAX_NOTE_LENGTH} character limit`,
    };
  }
  return { ok: true, parcelId, text };
}

async function readStore(file: string): Promise<NotesStore> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as NotesStore;
    return Array.isArray(parsed.notes) ? parsed : { notes: [] };
  } catch {
    return { notes: [] };
  }
}

async function writeStoreAtomic(file: string, store: NotesStore): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

export async function getNotesForParcel(
  parcelId: string,
  file: string = DEFAULT_NOTES_FILE
): Promise<ParcelNote[]> {
  const store = await readStore(file);
  return store.notes.filter((n) => n.parcelId === parcelId);
}

export async function upsertNote(
  parcelId: string,
  text: string,
  file: string = DEFAULT_NOTES_FILE
): Promise<ParcelNote> {
  const store = await readStore(file);
  const now = new Date().toISOString();
  const idx = store.notes.findIndex((n) => n.parcelId === parcelId);

  let saved: ParcelNote;
  if (idx >= 0) {
    saved = { ...store.notes[idx], text, updatedAt: now };
    store.notes[idx] = saved;
  } else {
    saved = { id: randomUUID(), parcelId, text, createdAt: now, updatedAt: now };
    store.notes.push(saved);
  }

  await writeStoreAtomic(file, store);
  return saved;
}
