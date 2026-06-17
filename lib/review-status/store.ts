/**
 * Parcel review-status store — file-backed, single-process local persistence.
 *
 * Local server storage, NOT an enterprise-durable datastore.
 * One current record per parcel plus a small append-only transition history.
 * Writes are atomic (temp + rename) so a crash mid-write cannot corrupt the store.
 */
import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_REVIEW_STATUS,
  MAX_CHANGE_NOTE_LENGTH,
  type ReviewStatus,
  isReviewStatus,
} from "./constants";

export { MAX_CHANGE_NOTE_LENGTH };

export const DEFAULT_REVIEW_FILE = path.join(process.cwd(), "data", "review-status.json");

export interface ReviewTransition {
  from?: ReviewStatus;
  to: ReviewStatus;
  note?: string;
  at: string;
  by?: string;
}

export interface ParcelReviewRecord {
  parcelId: string;
  status: ReviewStatus;
  changeNote?: string;
  updatedAt: string;
  updatedBy?: string;
  history: ReviewTransition[];
}

interface ReviewStore {
  records: ParcelReviewRecord[];
}

export type ReviewValidation =
  | { ok: true; parcelId: string; status: ReviewStatus; note?: string }
  | { ok: false; status: number; error: string };

/** Validate an incoming POST payload. Pure — no I/O. */
export function validateReviewPayload(body: unknown): ReviewValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, error: "request body must be an object" };
  }
  const { parcelId, status, note } = body as {
    parcelId?: unknown;
    status?: unknown;
    note?: unknown;
  };

  if (typeof parcelId !== "string" || parcelId.trim() === "") {
    return { ok: false, status: 400, error: "parcelId is required" };
  }
  if (!isReviewStatus(status)) {
    return { ok: false, status: 400, error: "status is not a recognized review status" };
  }
  if (note !== undefined && typeof note !== "string") {
    return { ok: false, status: 400, error: "note must be a string" };
  }
  if (typeof note === "string" && note.length > MAX_CHANGE_NOTE_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: `note exceeds ${MAX_CHANGE_NOTE_LENGTH} character limit`,
    };
  }
  return { ok: true, parcelId, status, note };
}

async function readStore(file: string): Promise<ReviewStore> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as ReviewStore;
    return Array.isArray(parsed.records) ? parsed : { records: [] };
  } catch {
    return { records: [] };
  }
}

async function writeStoreAtomic(file: string, store: ReviewStore): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

/** Returns the current record for a parcel, or a synthetic default (unreviewed, empty history). */
export async function getReviewRecord(
  parcelId: string,
  file: string = DEFAULT_REVIEW_FILE
): Promise<ParcelReviewRecord> {
  const store = await readStore(file);
  const existing = store.records.find((r) => r.parcelId === parcelId);
  if (existing) return existing;
  return {
    parcelId,
    status: DEFAULT_REVIEW_STATUS,
    updatedAt: new Date(0).toISOString(),
    history: [],
  };
}

/** Upsert the current status and append a transition to history. */
export async function setReviewStatus(
  parcelId: string,
  status: ReviewStatus,
  note?: string,
  by?: string,
  file: string = DEFAULT_REVIEW_FILE
): Promise<ParcelReviewRecord> {
  const store = await readStore(file);
  const now = new Date().toISOString();
  const idx = store.records.findIndex((r) => r.parcelId === parcelId);

  const transition: ReviewTransition = {
    from: idx >= 0 ? store.records[idx].status : undefined,
    to: status,
    note,
    at: now,
    by,
  };

  let saved: ParcelReviewRecord;
  if (idx >= 0) {
    saved = {
      ...store.records[idx],
      status,
      changeNote: note,
      updatedAt: now,
      updatedBy: by,
      history: [...store.records[idx].history, transition],
    };
    store.records[idx] = saved;
  } else {
    saved = {
      parcelId,
      status,
      changeNote: note,
      updatedAt: now,
      updatedBy: by,
      history: [transition],
    };
    store.records.push(saved);
  }

  await writeStoreAtomic(file, store);
  return saved;
}
