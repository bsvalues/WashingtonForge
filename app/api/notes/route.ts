import { NextRequest, NextResponse } from "next/server";
import {
  validateNotePayload,
  getNotesForParcel as fileGetNotes,
  upsertNote as fileUpsertNote,
} from "@/lib/notes/store";
import { getAppPool, getNotesForParcel as dbGetNotes, upsertNote as dbUpsertNote } from "@/lib/db";

/**
 * /api/notes
 *
 * Backed by Postgres (washingtonforge.parcel_notes) when the app database is
 * configured; otherwise falls back to the local file store so the app still
 * works with zero infra.
 */
export async function GET(req: NextRequest) {
  const parcelId = req.nextUrl.searchParams.get("parcelId");
  if (!parcelId) {
    return NextResponse.json({ error: "parcelId required" }, { status: 400 });
  }

  const notes = getAppPool() ? await dbGetNotes(parcelId) : await fileGetNotes(parcelId);
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const validation = validateNotePayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  try {
    const note = getAppPool()
      ? await dbUpsertNote(validation.parcelId, validation.text)
      : await fileUpsertNote(validation.parcelId, validation.text);
    return NextResponse.json({ note });
  } catch (err) {
    console.error("[notes] upsert failed:", err);
    return NextResponse.json({ error: "failed to save note" }, { status: 500 });
  }
}
