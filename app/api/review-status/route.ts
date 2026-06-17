import { NextRequest, NextResponse } from "next/server";
import { getReviewRecord, setReviewStatus, validateReviewPayload } from "@/lib/review-status/store";

export async function GET(req: NextRequest) {
  const parcelId = req.nextUrl.searchParams.get("parcelId");
  if (!parcelId) {
    return NextResponse.json({ error: "parcelId required" }, { status: 400 });
  }
  const record = await getReviewRecord(parcelId);
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

  const record = await setReviewStatus(validation.parcelId, validation.status, validation.note);
  return NextResponse.json({ record });
}
