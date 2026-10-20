import { NextRequest, NextResponse } from "next/server";
import {
  validateReviewPayload,
  getReviewRecord as fileGetReviewRecord,
  setReviewStatus as fileSetReviewStatus,
} from "@/lib/review-status/store";
import { DEFAULT_REVIEW_STATUS } from "@/lib/review-status/constants";
import {
  getAppPool,
  getReviewRecord as dbGetReviewRecord,
  setReviewStatus as dbSetReviewStatus,
} from "@/lib/db";

/** Synthetic default record (unreviewed, empty history) — matches the file store. */
function defaultRecord(parcelId: string) {
  return {
    parcelId,
    status: DEFAULT_REVIEW_STATUS,
    updatedAt: new Date(0).toISOString(),
    history: [],
  };
}

/**
 * /api/review-status
 *
 * Backed by Postgres (washingtonforge.parcel_review + _history) when the app
 * database is configured; otherwise falls back to the local file store.
 */
export async function GET(req: NextRequest) {
  const parcelId = req.nextUrl.searchParams.get("parcelId");
  if (!parcelId) {
    return NextResponse.json({ error: "parcelId required" }, { status: 400 });
  }

  let record;
  if (getAppPool()) {
    const dbRecord = await dbGetReviewRecord(parcelId);
    record = dbRecord ?? defaultRecord(parcelId);
  } else {
    record = await fileGetReviewRecord(parcelId);
  }
  return NextResponse.json({ record });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const validation = validateReviewPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  try {
    const record = getAppPool()
      ? await dbSetReviewStatus(validation.parcelId, validation.status, validation.note)
      : await fileSetReviewStatus(validation.parcelId, validation.status, validation.note);
    return NextResponse.json({ record });
  } catch (err) {
    console.error("[review-status] set failed:", err);
    return NextResponse.json({ error: "failed to save review status" }, { status: 500 });
  }
}
