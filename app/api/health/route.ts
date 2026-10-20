import { NextResponse } from "next/server";
import { getProvenance } from "@/lib/db/provenance";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Reports data provenance: is the app serving REAL (live Postgres) data or
 * SIMULATED (demo) data? This is the single source of truth for the UI
 * provenance badge (F2/F4).
 */
export async function GET() {
  try {
    const provenance = await getProvenance();
    return NextResponse.json({
      status: "ok",
      ...provenance,
    });
  } catch (err) {
    // Even if the probe throws, report simulated so the UI degrades gracefully.
    return NextResponse.json({
      status: "degraded",
      mode: "simulated",
      geo: false,
      app: false,
      redis: false,
      parcelCount: 0,
      checkedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}
