import { NextRequest, NextResponse } from "next/server";
import { WA_COUNTIES, type WACountyFips } from "@/lib/wa-data/types";

/**
 * WA Parcel Fabric API
 * 
 * This route provides access to Washington State parcel data.
 * In production, this would connect to PostgreSQL + PostGIS.
 * 
 * GET /api/wa-fabric?county=53005
 * GET /api/wa-fabric?county=53005&format=geojson&bbox=-119.5,46.1,-119.2,46.4
 * GET /api/wa-fabric?county=53005&limit=1000&simplify=0.0001
 * GET /api/wa-fabric?county=53005&since=2025-01-01T00:00:00Z
 * GET /api/wa-fabric/stats?county=53005
 * 
 * Query Parameters:
 * - county: FIPS code (required)
 * - format: "geojson" | "stats" (default: geojson)
 * - bbox: minLng,minLat,maxLng,maxLat (optional, for spatial filtering)
 * - limit: max features to return (default: 100, max: 10000)
 * - simplify: tolerance for geometry simplification (optional, e.g., 0.0001)
 * - since: ISO timestamp, only return parcels updated since (optional)
 * - fields: comma-separated list of properties to include (optional)
 * 
 * PRODUCTION NOTES:
 * - County-wide GeoJSON can be hundreds of MB - always use bbox or limit
 * - For high-volume use, implement MVT (Mapbox Vector Tiles) endpoint
 * - Consider caching with edge functions for common bbox queries
 */

// County approximate bounds for demo (production: computed from PostGIS)
const COUNTY_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
  "53005": { minLng: -119.9, maxLng: -119.0, minLat: 46.0, maxLat: 46.6 }, // Benton
  "53033": { minLng: -122.5, maxLng: -121.0, minLat: 47.0, maxLat: 47.8 }, // King
  "53053": { minLng: -122.8, maxLng: -121.5, minLat: 46.8, maxLat: 47.4 }, // Pierce
  "53063": { minLng: -117.8, maxLng: -117.0, minLat: 47.4, maxLat: 48.0 }, // Spokane
  "53011": { minLng: -122.9, maxLng: -122.3, minLat: 45.5, maxLat: 46.0 }, // Clark
};

interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

function parseBBox(bbox: string | null): BBox | null {
  if (!bbox) return null;
  const parts = bbox.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return {
    minLng: parts[0],
    minLat: parts[1],
    maxLng: parts[2],
    maxLat: parts[3],
  };
}

function isWithinBBox(lng: number, lat: number, bbox: BBox): boolean {
  return lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat;
}

// Simulated parcel data for demo
function generateDemoParcelGeoJSON(
  fips: WACountyFips,
  options: {
    limit?: number;
    bbox?: BBox | null;
    simplify?: number;
    since?: string | null;
    fields?: string[];
  }
) {
  const county = WA_COUNTIES[fips];
  if (!county) return null;

  const { limit = 100, bbox, simplify, since, fields } = options;
  const maxLimit = Math.min(limit, 10000); // Cap at 10k for demo

  const countyBounds = bbox || COUNTY_BOUNDS[fips] || {
    minLng: -123.0,
    maxLng: -117.0,
    minLat: 45.5,
    maxLat: 49.0,
  };

  const features = [];
  let attempts = 0;
  const maxAttempts = maxLimit * 3; // Allow some misses for bbox filtering

  while (features.length < maxLimit && attempts < maxAttempts) {
    attempts++;
    
    const lng = countyBounds.minLng + Math.random() * (countyBounds.maxLng - countyBounds.minLng);
    const lat = countyBounds.minLat + Math.random() * (countyBounds.maxLat - countyBounds.minLat);
    
    // Skip if outside requested bbox
    if (bbox && !isWithinBBox(lng, lat, bbox)) continue;
    
    // Generate a simple polygon (small rectangle)
    let size = 0.001 + Math.random() * 0.002;
    
    // Apply simplification (reduce polygon precision)
    if (simplify && simplify > 0) {
      size = Math.max(size, simplify * 10);
    }
    
    const baseProperties: Record<string, string | number> = {
      parcel_uid: `${fips}-${String(features.length + 1).padStart(6, "0")}`,
      county_fips: fips,
      county_name: county.name,
      original_parcel_id: `${Math.floor(Math.random() * 999999).toString().padStart(6, "0")}`,
      acreage: parseFloat((Math.random() * 5 + 0.1).toFixed(2)),
      source_version: "WA_Parcels_2025_Sept",
      updated_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    // Filter properties if fields specified
    const properties = fields
      ? Object.fromEntries(Object.entries(baseProperties).filter(([k]) => fields.includes(k)))
      : baseProperties;
    
    // Skip if since filter and parcel is older
    if (since && baseProperties.updated_at < since) continue;
    
    features.push({
      type: "Feature",
      id: features.length + 1,
      properties,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))],
            [parseFloat((lng + size).toFixed(6)), parseFloat(lat.toFixed(6))],
            [parseFloat((lng + size).toFixed(6)), parseFloat((lat + size).toFixed(6))],
            [parseFloat(lng.toFixed(6)), parseFloat((lat + size).toFixed(6))],
            [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))],
          ],
        ],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
    metadata: {
      county_fips: fips,
      county_name: county.name,
      total_count: features.length,
      source: "WA Geospatial Open Data Portal",
      source_version: "WA_Parcels_2025_Sept",
      generated_at: new Date().toISOString(),
      query: {
        bbox: bbox ? `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}` : null,
        limit: maxLimit,
        simplify: simplify || null,
        since: since || null,
      },
      _links: {
        self: `/api/wa-fabric?county=${fips}&limit=${maxLimit}`,
        next: features.length === maxLimit 
          ? `/api/wa-fabric?county=${fips}&limit=${maxLimit}&offset=${maxLimit}` 
          : null,
        mvt: `/api/wa-fabric/tiles/{z}/{x}/{y}.mvt?county=${fips}`, // Future MVT endpoint
      },
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county") as WACountyFips | null;
  const format = searchParams.get("format") || "geojson";
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const bboxParam = searchParams.get("bbox");
  const simplify = parseFloat(searchParams.get("simplify") || "0");
  const since = searchParams.get("since");
  const fieldsParam = searchParams.get("fields");

  if (!county) {
    return NextResponse.json(
      { 
        error: "Missing required parameter: county",
        usage: "GET /api/wa-fabric?county=53005&bbox=-119.5,46.1,-119.2,46.4&limit=1000",
      },
      { status: 400 }
    );
  }

  if (!WA_COUNTIES[county]) {
    return NextResponse.json(
      { 
        error: `Invalid county FIPS code: ${county}`,
        valid_counties: Object.keys(WA_COUNTIES).slice(0, 10).join(", ") + "...",
      },
      { status: 400 }
    );
  }

  const bbox = parseBBox(bboxParam);
  const fields = fieldsParam ? fieldsParam.split(",") : undefined;

  // Generate demo data with all filters applied
  const geojson = generateDemoParcelGeoJSON(county, {
    limit: Math.min(limit, 10000),
    bbox,
    simplify: simplify > 0 ? simplify : undefined,
    since,
    fields,
  });

  if (format === "geojson") {
    // Add cache headers for edge caching
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    headers.set("Content-Type", "application/geo+json");
    
    return NextResponse.json(geojson, { headers });
  }

  // Return just the metadata/stats
  return NextResponse.json({
    county_fips: county,
    county_name: WA_COUNTIES[county].name,
    parcel_count: geojson?.features.length || 0,
    source: "WA Geospatial Open Data Portal",
    source_version: "WA_Parcels_2025_Sept",
    source_url: "https://geo.wa.gov/maps/2b603a599a0842a3b2284c04c8927f35",
    last_updated: "2025-09-15T00:00:00Z",
    bounds: COUNTY_BOUNDS[county] || null,
    _links: {
      geojson: `/api/wa-fabric?county=${county}&format=geojson&limit=100`,
      mvt: `/api/wa-fabric/tiles/{z}/{x}/{y}.mvt?county=${county}`,
    },
  });
}

// POST: Load WA fabric for a county (triggers background job in production)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { county_fips, options } = body;

    if (!county_fips || !WA_COUNTIES[county_fips as WACountyFips]) {
      return NextResponse.json(
        { error: "Invalid or missing county_fips" },
        { status: 400 }
      );
    }

    const county = WA_COUNTIES[county_fips as WACountyFips];

    // In production, this would:
    // 1. Queue a background job to fetch from WA Geo Portal
    // 2. Load into PostGIS with spatial indexing
    // 3. Build vector tile cache
    // 4. Update county status

    // For demo, simulate the job
    const estimatedParcels = Math.floor(county.population * 0.4);

    return NextResponse.json({
      success: true,
      message: `Loading WA parcel fabric for ${county.name} County`,
      job_id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      county_fips,
      county_name: county.name,
      estimated_parcels: estimatedParcels,
      status: "processing",
      estimated_completion: new Date(Date.now() + 60000).toISOString(), // ~1 min
      source: {
        name: "WA Geospatial Open Data Portal",
        url: "https://geo.wa.gov/maps/2b603a599a0842a3b2284c04c8927f35",
        version: "WA_Parcels_2025_Sept",
      },
      options: {
        build_spatial_index: options?.build_spatial_index ?? true,
        generate_mvt_cache: options?.generate_mvt_cache ?? true,
        simplification_tolerance: options?.simplification_tolerance ?? 0.00001,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
