import { NextRequest, NextResponse } from "next/server";
import { getNotesForParcel, upsertNote, validateNotePayload } from "@/lib/notes/store";

export async function GET(req: NextRequest) {
  const parcelId = req.nextUrl.searchParams.get("parcelId");
  if (!parcelId) {
    return NextResponse.json({ error: "parcelId required" }, { status: 400 });
  }
  const notes = await getNotesForParcel(parcelId);
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

  const note = await upsertNote(validation.parcelId, validation.text);
  return NextResponse.json({ note });
}
