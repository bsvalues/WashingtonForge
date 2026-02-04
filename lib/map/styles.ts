/**
 * TerraFusion MapLibre Style Definitions
 * 
 * Known-good raster style for OSM tile rendering.
 * This style includes BOTH the source AND a layer that references it,
 * which is required for MapLibre to actually fetch tiles.
 */

import type { StyleSpecification } from "maplibre-gl";

/**
 * Minimal raster style for OpenStreetMap tiles.
 * 
 * IMPORTANT: A MapLibre style must contain:
 * 1. A source definition (type: "raster", tiles: [...])
 * 2. A layer that USES that source (type: "raster", source: "osm")
 * 
 * If the layer is missing, MapLibre will NOT request tiles.
 */
export const RASTER_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

/**
 * Dark raster style using CartoDB dark matter tiles.
 * Better suited for the TerraFusion dark theme.
 */
export const DARK_RASTER_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "carto-dark",
      type: "raster",
      source: "carto",
    },
  ],
};

/**
 * Benton County, WA center coordinates and default bounds.
 */
export const BENTON_COUNTY_CENTER: [number, number] = [-119.5, 46.25];
export const BENTON_COUNTY_BOUNDS: [[number, number], [number, number]] = [
  [-120.0, 45.9], // SW
  [-119.0, 46.6], // NE
];
export const DEFAULT_ZOOM = 10;

/**
 * Debug helper: log style sources and layers on map load.
 * Call this in map.on("load") to verify tile requests will work.
 */
export function logMapStyle(map: maplibregl.Map): void {
  const style = map.getStyle();
  console.log("[MapLibre] sources:", Object.keys(style?.sources ?? {}));
  console.log("[MapLibre] layers:", (style?.layers ?? []).map((l) => l.id));
}
