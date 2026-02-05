import { NextRequest, NextResponse } from "next/server";
import { WA_COUNTIES, type WACountyFips } from "@/lib/wa-data/types";

/**
 * WA Parcel Fabric API
 * 
 * This route provides access to Washington State parcel data.
 * In production, this would connect to PostgreSQL + PostGIS.
 * 
 * GET /api/wa-fabric?county=53005
 * GET /api/wa-fabric?county=53005&format=geojson
 * GET /api/wa-fabric/stats?county=53005
 */

// Simulated parcel data for demo
function generateDemoParcelGeoJSON(fips: WACountyFips, limit: number = 100) {
  const county = WA_COUNTIES[fips];
  if (!county) return null;

  // Benton County approximate bounds
  const bounds = {
    "53005": { minLng: -119.9, maxLng: -119.0, minLat: 46.0, maxLat: 46.6 }, // Benton
    "53033": { minLng: -122.5, maxLng: -121.0, minLat: 47.0, maxLat: 47.8 }, // King
    "53053": { minLng: -122.8, maxLng: -121.5, minLat: 46.8, maxLat: 47.4 }, // Pierce
  };

  const countyBounds = bounds[fips as keyof typeof bounds] || {
    minLng: -123.0,
    maxLng: -117.0,
    minLat: 45.5,
    maxLat: 49.0,
  };

  const features = [];
  for (let i = 0; i < limit; i++) {
    const lng = countyBounds.minLng + Math.random() * (countyBounds.maxLng - countyBounds.minLng);
    const lat = countyBounds.minLat + Math.random() * (countyBounds.maxLat - countyBounds.minLat);
    
    // Generate a simple polygon (small rectangle)
    const size = 0.001 + Math.random() * 0.002;
    
    features.push({
      type: "Feature",
      id: i + 1,
      properties: {
        parcel_uid: `${fips}-${String(i + 1).padStart(6, "0")}`,
        county_fips: fips,
        county_name: county.name,
        original_parcel_id: `${Math.floor(Math.random() * 999999).toString().padStart(6, "0")}`,
        acreage: (Math.random() * 5 + 0.1).toFixed(2),
        source_version: "WA_Parcels_2025_Sept",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lng, lat],
            [lng + size, lat],
            [lng + size, lat + size],
            [lng, lat + size],
            [lng, lat],
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
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county") as WACountyFips | null;
  const format = searchParams.get("format") || "geojson";
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  if (!county) {
    return NextResponse.json(
      { error: "Missing required parameter: county" },
      { status: 400 }
    );
  }

  if (!WA_COUNTIES[county]) {
    return NextResponse.json(
      { error: `Invalid county FIPS code: ${county}` },
      { status: 400 }
    );
  }

  // Generate demo data
  const geojson = generateDemoParcelGeoJSON(county, Math.min(limit, 1000));

  if (format === "geojson") {
    return NextResponse.json(geojson);
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
  });
}

// POST: Load WA fabric for a county (triggers background job in production)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { county_fips } = body;

    if (!county_fips || !WA_COUNTIES[county_fips as WACountyFips]) {
      return NextResponse.json(
        { error: "Invalid or missing county_fips" },
        { status: 400 }
      );
    }

    const county = WA_COUNTIES[county_fips as WACountyFips];

    // In production, this would:
    // 1. Queue a background job to fetch from WA Geo Portal
    // 2. Load into PostGIS
    // 3. Build spatial indexes
    // 4. Update county status

    // For demo, simulate the job
    const estimatedParcels = Math.floor(county.population * 0.4);

    return NextResponse.json({
      success: true,
      message: `Loading WA parcel fabric for ${county.name} County`,
      job_id: `job-${Date.now()}`,
      county_fips,
      county_name: county.name,
      estimated_parcels: estimatedParcels,
      status: "processing",
      source: {
        name: "WA Geospatial Open Data Portal",
        url: "https://geo.wa.gov/maps/2b603a599a0842a3b2284c04c8927f35",
        version: "WA_Parcels_2025_Sept",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
