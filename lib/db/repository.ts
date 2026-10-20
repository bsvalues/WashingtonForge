/**
 * WashingtonForge — Data repository (server-only).
 *
 * Typed queries over the cloned PACS data:
 *  - Read-only parcel fabric from `benton_geo.parcel_current` (74,058 rows,
 *    PostGIS geometry in SRID 2927 = NAD83 / WA State Plane South).
 *  - Writable app state (notes, review status) in `washingtonforge`.
 *
 * Every function is defensive: if the relevant pool is not configured it
 * returns a safe empty/default value (never throws), so callers can fall
 * back to demo data.
 *
 * IMPORTANT: server-side only (imports pg). Never import from "use client".
 */
import { getGeoPool, getAppPool } from "./pool";
import { cacheGet, cacheSet } from "./cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParcelRow {
  id: string;
  parcelId: string;
  situs: string;
  ownerName: string;
  landValue: number;
  impValue: number;
  totalValue: number;
  marketValue: number;
  assessedValue: number;
  appraisedValue: number;
  acreage: number;
  propertyClass: string;
  neighborhood: string;
  zoning: string;
  equityStatus: "fair" | "progressive" | "regressive";
  ratio: number | null;
  lastAppraisal: string | null;
  geometry: GeoJSON.Geometry | null;
}

export interface ParcelStats {
  count: number;
  totalAssessed: number;
  totalMarket: number;
  medianAssessed: number;
  withGeometry: number;
}

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface ParcelQuery {
  bbox?: BBox | null;
  limit?: number;
  offset?: number;
  /**
   * When set, only every Nth parcel (by prop_id) is returned. This yields an
   * even spatial spread across the county for map previews, instead of the
   * first N (which cluster together because prop_id is sequential).
   */
  sampleEvery?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

/** Derive equity status from assessed vs market value. */
function equityStatus(assessed: number, market: number): "fair" | "progressive" | "regressive" {
  if (market <= 0) return "fair";
  const ratio = assessed / market;
  if (ratio > 1.05) return "progressive";
  if (ratio < 0.95) return "regressive";
  return "fair";
}

function ratioOf(assessed: number, market: number): number | null {
  if (market <= 0) return null;
  return Math.round((assessed / market) * 1000) / 1000;
}

/**
 * Map a raw parcel_current row (with a GeoJSON geometry string) to a ParcelRow.
 */
function mapRow(r: Record<string, unknown>): ParcelRow {
  const assessed = num(r.assessed_val);
  const market = num(r.market);
  const geoJson = r.geom_geojson ? JSON.parse(r.geom_geojson as string) : null;
  return {
    id: String(r.prop_id),
    parcelId: String(r.parcel_id ?? r.prop_id),
    situs: (r.situs as string) || "",
    ownerName: (r.owner_name as string) || "",
    landValue: num(r.land_val),
    impValue: num(r.imprv_val),
    totalValue: num(r.assessed_val),
    marketValue: market,
    assessedValue: assessed,
    appraisedValue: num(r.appraised_val),
    acreage: num(r.gis_acres),
    propertyClass: (r.prop_type_desc as string) || (r.prop_type_cd as string) || "Unknown",
    neighborhood: (r.hood_cd as string) || "",
    zoning: (r.zoning as string) || "",
    equityStatus: equityStatus(assessed, market),
    ratio: ratioOf(assessed, market),
    lastAppraisal: r.last_appraisal_dt ? String(r.last_appraisal_dt) : null,
    geometry: geoJson as GeoJSON.Geometry | null,
  };
}

// ---------------------------------------------------------------------------
// Parcel fabric (read-only, benton_geo)
// ---------------------------------------------------------------------------

/**
 * Fetch parcels as a GeoJSON FeatureCollection.
 *
 * - If `bbox` is provided (WGS84 lng/lat), it is transformed to SRID 2927 and
 *   used as a spatial filter (fast, uses the GiST index).
 * - Otherwise the first `limit` parcels (by prop_id) are returned.
 * - Geometry is stored in SRID 2927 (WA State Plane South, feet) but is
 *   transformed to WGS84 (4326, lng/lat) before serialization so the map
 *   (Web Mercator) can render it directly.
 */
export async function getParcelsGeoJSON(
  query: ParcelQuery = {}
): Promise<GeoJSON.FeatureCollection> {
  const pool = getGeoPool();
  if (!pool) return { type: "FeatureCollection", features: [] };

  const limit = Math.min(Math.max(query.limit ?? 500, 1), 10000);
  const offset = Math.max(query.offset ?? 0, 0);

  const params: unknown[] = [];
  let where = "geom IS NOT NULL";
  if (query.bbox) {
    // Build a WGS84 envelope, transform to 2927, and intersect.
    params.push(query.bbox.minLng, query.bbox.minLat, query.bbox.maxLng, query.bbox.maxLat);
    where =
      "geom IS NOT NULL AND geom && ST_Transform(ST_MakeEnvelope($1, $2, $3, $4, 4326), 2927)";
  }
  if (query.sampleEvery && query.sampleEvery > 1) {
    params.push(query.sampleEvery);
    where += ` AND (prop_id % $${params.length} = 0)`;
  }
  params.push(limit, offset);

  const sql = `
    SELECT
      prop_id,
      parcel_id,
      situs,
      owner_name,
      gis_acres,
      prop_type_cd,
      prop_type_desc,
      zoning,
      hood_cd,
      appraised_val,
      assessed_val,
      market,
      (COALESCE(land_hstd_val,0) + COALESCE(land_non_hstd_val,0)) AS land_val,
      (COALESCE(imprv_hstd_val,0) + COALESCE(imprv_non_hstd_val,0)) AS imprv_val,
      last_appraisal_dt,
      ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geom_geojson
    FROM parcel_current
    WHERE ${where}
    ORDER BY prop_id
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  try {
    const res = await pool.query(sql, params);
    const features: GeoJSON.Feature[] = res.rows
      .map((r) => mapRow(r))
      .filter((p) => p.geometry)
      .map((p) => ({
        type: "Feature" as const,
        id: p.id,
        geometry: p.geometry as GeoJSON.Geometry,
        properties: {
          id: p.id,
          parcelId: p.parcelId,
          situs: p.situs,
          ownerName: p.ownerName,
          assessedValue: p.assessedValue,
          marketValue: p.marketValue,
          totalValue: p.totalValue,
          landValue: p.landValue,
          impValue: p.impValue,
          acreage: p.acreage,
          propertyClass: p.propertyClass,
          neighborhood: p.neighborhood,
          zoning: p.zoning,
          equityStatus: p.equityStatus,
          ratio: p.ratio,
        },
      }));
    return { type: "FeatureCollection", features };
  } catch (err) {
    console.error("[db] getParcelsGeoJSON failed:", err);
    return { type: "FeatureCollection", features: [] };
  }
}

/** Total parcel count (with geometry) in the fabric. */
export async function getParcelCount(): Promise<number> {
  const pool = getGeoPool();
  if (!pool) return 0;
  try {
    const res = await pool.query(
      "SELECT count(*)::int AS n FROM parcel_current WHERE geom IS NOT NULL"
    );
    return res.rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

/** Aggregate stats for the dashboard (cached in Redis for 5 min). */
export async function getParcelStats(): Promise<ParcelStats | null> {
  const pool = getGeoPool();
  if (!pool) return null;

  const cacheKey = "wf:parcel:stats:v1";
  const cached = await cacheGet<ParcelStats>(cacheKey);
  if (cached) return cached;

  try {
    const res = await pool.query(`
      SELECT
        count(*)::int AS count,
        COALESCE(sum(assessed_val),0)::float8 AS total_assessed,
        COALESCE(sum(market),0)::float8 AS total_market,
        COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY assessed_val),0)::float8 AS median_assessed,
        count(*) FILTER (WHERE geom IS NOT NULL)::int AS with_geometry
      FROM parcel_current
    `);
    const r = res.rows[0];
    const stats: ParcelStats = {
      count: r.count,
      totalAssessed: r.total_assessed,
      totalMarket: r.total_market,
      medianAssessed: r.median_assessed,
      withGeometry: r.with_geometry,
    };
    await cacheSet(cacheKey, stats, 300);
    return stats;
  } catch (err) {
    console.error("[db] getParcelStats failed:", err);
    return null;
  }
}

/** Fetch a single parcel by prop_id (for the selection drawer / detail). */
export async function getParcelById(propId: string): Promise<ParcelRow | null> {
  const pool = getGeoPool();
  if (!pool) return null;
  try {
    const res = await pool.query(
      `
      SELECT
        prop_id, parcel_id, situs, owner_name, gis_acres,
        prop_type_cd, prop_type_desc, zoning, hood_cd,
        appraised_val, assessed_val, market,
        (COALESCE(land_hstd_val,0) + COALESCE(land_non_hstd_val,0)) AS land_val,
        (COALESCE(imprv_hstd_val,0) + COALESCE(imprv_non_hstd_val,0)) AS imprv_val,
        last_appraisal_dt,
        ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geom_geojson
      FROM parcel_current
      WHERE prop_id = $1
      LIMIT 1
      `,
      [propId]
    );
    if (res.rows.length === 0) return null;
    return mapRow(res.rows[0]);
  } catch (err) {
    console.error("[db] getParcelById failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// App state (writable, washingtonforge) — notes + review status
// ---------------------------------------------------------------------------

/**
 * Ensure the writable app-state tables exist. Idempotent. Called lazily before
 * the first write so the clone needs no manual migration step.
 */
let schemaReady = false;
export async function ensureAppSchema(): Promise<void> {
  const pool = getAppPool();
  if (!pool || schemaReady) return;
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parcel_notes (
        parcel_id  TEXT PRIMARY KEY,
        note_id    UUID NOT NULL,
        text       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS parcel_review (
        parcel_id   TEXT PRIMARY KEY,
        status      TEXT NOT NULL,
        change_note TEXT,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_by  TEXT
      );
      CREATE TABLE IF NOT EXISTS parcel_review_history (
        id          BIGSERIAL PRIMARY KEY,
        parcel_id   TEXT NOT NULL,
        from_status TEXT,
        to_status   TEXT NOT NULL,
        note        TEXT,
        at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        by          TEXT
      );
    `);
    schemaReady = true;
  } catch (err) {
    console.error("[db] ensureAppSchema failed:", err);
    throw err;
  }
}

export interface DbNote {
  id: string;
  parcelId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export async function getNotesForParcel(parcelId: string): Promise<DbNote[]> {
  const pool = getAppPool();
  if (!pool) return [];
  try {
    const res = await pool.query(
      "SELECT note_id, parcel_id, text, created_at, updated_at FROM parcel_notes WHERE parcel_id = $1",
      [parcelId]
    );
    return res.rows.map((r) => ({
      id: r.note_id,
      parcelId: r.parcel_id,
      text: r.text,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function upsertNote(parcelId: string, text: string): Promise<DbNote> {
  const pool = getAppPool();
  if (!pool) throw new Error("app database not configured");
  await ensureAppSchema();
  const now = new Date().toISOString();
  const res = await pool.query(
    `
    INSERT INTO parcel_notes (parcel_id, note_id, text, created_at, updated_at)
    VALUES ($1, gen_random_uuid(), $2, now(), now())
    ON CONFLICT (parcel_id) DO UPDATE
      SET text = EXCLUDED.text, updated_at = now()
    RETURNING note_id, parcel_id, text, created_at, updated_at
    `,
    [parcelId, text]
  );
  const r = res.rows[0];
  return {
    id: r.note_id,
    parcelId: r.parcel_id,
    text: r.text,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface DbReviewRecord {
  parcelId: string;
  status: string;
  changeNote?: string;
  updatedAt: string;
  updatedBy?: string;
  history: { from?: string; to: string; note?: string; at: string; by?: string }[];
}

export async function getReviewRecord(parcelId: string): Promise<DbReviewRecord | null> {
  const pool = getAppPool();
  if (!pool) return null;
  try {
    const rec = await pool.query(
      "SELECT status, change_note, updated_at, updated_by FROM parcel_review WHERE parcel_id = $1",
      [parcelId]
    );
    if (rec.rows.length === 0) return null;
    const hist = await pool.query(
      "SELECT from_status, to_status, note, at, by FROM parcel_review_history WHERE parcel_id = $1 ORDER BY id",
      [parcelId]
    );
    const r = rec.rows[0];
    return {
      parcelId,
      status: r.status,
      changeNote: r.change_note ?? undefined,
      updatedAt: r.updated_at,
      updatedBy: r.updated_by ?? undefined,
      history: hist.rows.map((h) => ({
        from: h.from_status ?? undefined,
        to: h.to_status,
        note: h.note ?? undefined,
        at: h.at,
        by: h.by ?? undefined,
      })),
    };
  } catch {
    return null;
  }
}

export async function setReviewStatus(
  parcelId: string,
  status: string,
  note?: string,
  by?: string
): Promise<DbReviewRecord> {
  const pool = getAppPool();
  if (!pool) throw new Error("app database not configured");
  await ensureAppSchema();

  const prev = await getReviewRecord(parcelId);
  const now = new Date().toISOString();

  await pool.query(
    `
    INSERT INTO parcel_review (parcel_id, status, change_note, updated_at, updated_by)
    VALUES ($1, $2, $3, now(), $4)
    ON CONFLICT (parcel_id) DO UPDATE
      SET status = EXCLUDED.status,
          change_note = EXCLUDED.change_note,
          updated_at = now(),
          updated_by = EXCLUDED.updated_by
    `,
    [parcelId, status, note ?? null, by ?? null]
  );
  await pool.query(
    "INSERT INTO parcel_review_history (parcel_id, from_status, to_status, note, at, by) VALUES ($1,$2,$3,$4,now(),$5)",
    [parcelId, prev?.status ?? null, status, note ?? null, by ?? null]
  );

  return {
    parcelId,
    status,
    changeNote: note,
    updatedAt: now,
    updatedBy: by,
    history: [...(prev?.history ?? []), { from: prev?.status, to: status, note, at: now, by }],
  };
}
