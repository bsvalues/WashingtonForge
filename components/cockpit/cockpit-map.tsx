"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import { Loader2, Lasso, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlassCard } from "@/components/material";
import { HoverTooltip } from "./hover-tooltip";
import { MapControls } from "./map-controls";
import { useSelection } from "@/lib/selection";
import { getMapLayers, type ParcelFilter, type Parcel, type MapLayer } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DARK_RASTER_STYLE, BENTON_COUNTY_CENTER, DEFAULT_ZOOM, logMapStyle } from "@/lib/map/styles";

interface CockpitMapProps {
  filters: ParcelFilter;
  parcels: Parcel[];
  onZoomToParcel?: (parcel: Parcel) => void;
}

// Generate GeoJSON features from parcels with pseudo-random positions around Benton County
function parcelsToGeoJSON(parcels: Parcel[]): GeoJSON.FeatureCollection {
  const [centerLng, centerLat] = BENTON_COUNTY_CENTER;
  const spread = 0.15; // ~10 miles spread

  return {
    type: "FeatureCollection",
    features: parcels.map((parcel, index) => {
      // Create a grid-like distribution with some randomness
      const gridSize = Math.ceil(Math.sqrt(parcels.length));
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      // Normalize to -0.5 to 0.5 range, then scale by spread
      const baseLng = centerLng + ((col / gridSize) - 0.5) * spread * 2;
      const baseLat = centerLat + ((row / gridSize) - 0.5) * spread * 2;

      // Add small random offset
      const lng = baseLng + (Math.random() - 0.5) * 0.01;
      const lat = baseLat + (Math.random() - 0.5) * 0.01;

      // Create a small polygon (parcel shape)
      const size = 0.002 + Math.random() * 0.001;
      const coordinates = [
        [
          [lng, lat],
          [lng + size, lat],
          [lng + size, lat + size * 0.8],
          [lng, lat + size * 0.8],
          [lng, lat],
        ],
      ];

      return {
        type: "Feature" as const,
        id: parcel.id,
        geometry: {
          type: "Polygon" as const,
          coordinates,
        },
        properties: {
          id: parcel.id,
          parcelNumber: parcel.parcelNumber,
          address: parcel.address,
          owner: parcel.owner,
          assessedValue: parcel.assessedValue,
          marketValue: parcel.marketValue,
          ratio: parcel.ratio,
          equityStatus: parcel.equityStatus,
          propertyType: parcel.propertyType,
          acreage: parcel.acreage,
          yearBuilt: parcel.yearBuilt,
          neighborhood: parcel.neighborhood,
        },
      };
    }),
  };
}

// Get fill color based on equity status
function getEquityColor(status: string): string {
  switch (status) {
    case "fair":
      return "rgba(16, 185, 129, 0.4)"; // emerald-500
    case "progressive":
      return "rgba(14, 165, 233, 0.4)"; // sky-500
    case "regressive":
      return "rgba(245, 158, 11, 0.4)"; // amber-500
    default:
      return "rgba(100, 100, 100, 0.3)";
  }
}

function getEquityStrokeColor(status: string): string {
  switch (status) {
    case "fair":
      return "rgba(16, 185, 129, 1)";
    case "progressive":
      return "rgba(14, 165, 233, 1)";
    case "regressive":
      return "rgba(245, 158, 11, 1)";
    default:
      return "rgba(100, 100, 100, 1)";
  }
}

export function CockpitMap({ filters, parcels, onZoomToParcel }: CockpitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(["drift-hotspots"]));
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Box select state
  const [boxSelectStart, setBoxSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [boxSelectEnd, setBoxSelectEnd] = useState<{ x: number; y: number } | null>(null);

  const {
    selectParcel,
    selectParcels,
    toggleParcel,
    setHoveredParcel,
    hoveredParcelId,
    isSelected,
    selectedParcelIds,
    selectMode,
    setSelectMode,
  } = useSelection();

  // Generate GeoJSON from parcels
  const geoJSON = useMemo(() => parcelsToGeoJSON(parcels), [parcels]);

  // Load map layers metadata
  useEffect(() => {
    async function loadLayers() {
      try {
        const mapLayers = await getMapLayers();
        setLayers(mapLayers);
      } catch {
        // Silently handle
      }
    }
    loadLayers();
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_RASTER_STYLE,
      center: BENTON_COUNTY_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      console.log("[v0] MapLibre loaded");
      logMapStyle(map);

      // Add parcels source
      map.addSource("parcels", {
        type: "geojson",
        data: geoJSON,
        generateId: true,
      });

      // Add fill layer for parcels
      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": [
            "match",
            ["get", "equityStatus"],
            "fair", "rgba(16, 185, 129, 0.35)",
            "progressive", "rgba(14, 165, 233, 0.35)",
            "regressive", "rgba(245, 158, 11, 0.35)",
            "rgba(100, 100, 100, 0.25)"
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false], 0.7,
            ["boolean", ["feature-state", "hover"], false], 0.55,
            0.4
          ],
        },
      });

      // Add stroke layer for parcels
      map.addLayer({
        id: "parcels-stroke",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": [
            "match",
            ["get", "equityStatus"],
            "fair", "rgba(16, 185, 129, 1)",
            "progressive", "rgba(14, 165, 233, 1)",
            "regressive", "rgba(245, 158, 11, 1)",
            "rgba(100, 100, 100, 1)"
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false], 2.5,
            ["boolean", ["feature-state", "hover"], false], 1.5,
            0.8
          ],
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false], 1,
            ["boolean", ["feature-state", "hover"], false], 0.9,
            0.6
          ],
        },
      });

      // Add selection highlight layer (renders on top)
      map.addLayer({
        id: "parcels-selection-glow",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": "rgba(59, 130, 246, 0.6)", // primary blue
          "line-width": 4,
          "line-blur": 3,
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false], 1,
            0
          ],
        },
      });

      setMapReady(true);
      setIsLoading(false);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Only run once on mount

  // Update GeoJSON data when parcels change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const source = mapRef.current.getSource("parcels") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geoJSON);
    }
  }, [geoJSON, mapReady]);

  // Update feature states for selection
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;

    // Clear all selection states first
    for (const feature of geoJSON.features) {
      if (feature.id) {
        map.setFeatureState(
          { source: "parcels", id: feature.id },
          { selected: false }
        );
      }
    }

    // Set selected states
    for (const id of selectedParcelIds) {
      const feature = geoJSON.features.find(f => f.properties?.id === id);
      if (feature?.id) {
        map.setFeatureState(
          { source: "parcels", id: feature.id },
          { selected: true }
        );
      }
    }
  }, [selectedParcelIds, geoJSON, mapReady]);

  // Update feature state for hover
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;

    // Clear all hover states
    for (const feature of geoJSON.features) {
      if (feature.id) {
        map.setFeatureState(
          { source: "parcels", id: feature.id },
          { hover: false }
        );
      }
    }

    // Set hovered state
    if (hoveredParcelId) {
      const feature = geoJSON.features.find(f => f.properties?.id === hoveredParcelId);
      if (feature?.id) {
        map.setFeatureState(
          { source: "parcels", id: feature.id },
          { hover: true }
        );
      }
    }
  }, [hoveredParcelId, geoJSON, mapReady]);

  // Set up map event handlers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (selectMode !== "none") return;

      const features = map.queryRenderedFeatures(e.point, { layers: ["parcels-fill"] });

      if (features.length > 0) {
        map.getCanvas().style.cursor = "pointer";
        const props = features[0].properties;
        if (props?.id) {
          setHoveredParcel(props.id);
          setTooltipPosition({ x: e.point.x, y: e.point.y });
        }
      } else {
        map.getCanvas().style.cursor = "";
        setHoveredParcel(null);
        setTooltipPosition(null);
      }
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["parcels-fill"] });

      if (features.length > 0) {
        const props = features[0].properties;
        if (props?.id) {
          if (selectMode === "lasso") {
            toggleParcel(props.id);
          } else if (selectMode === "none") {
            selectParcel(props.id, e.originalEvent.shiftKey);
          }
        }
      }
    };

    const handleMouseLeave = () => {
      setHoveredParcel(null);
      setTooltipPosition(null);
    };

    map.on("mousemove", handleMouseMove);
    map.on("click", handleClick);
    map.on("mouseleave", handleMouseLeave);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("click", handleClick);
      map.off("mouseleave", handleMouseLeave);
    };
  }, [mapReady, selectMode, setHoveredParcel, selectParcel, toggleParcel]);

  // Box select handlers
  const handleMapMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (selectMode !== "box") return;

      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (rect) {
        setBoxSelectStart({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
        setBoxSelectEnd(null);
      }
    },
    [selectMode]
  );

  const handleMapMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (selectMode !== "box" || !boxSelectStart) return;

      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (rect) {
        setBoxSelectEnd({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    },
    [selectMode, boxSelectStart]
  );

  const handleMapMouseUp = useCallback(() => {
    if (selectMode !== "box" || !boxSelectStart || !boxSelectEnd || !mapRef.current) {
      setBoxSelectStart(null);
      setBoxSelectEnd(null);
      return;
    }

    const map = mapRef.current;

    // Query features within the box
    const minX = Math.min(boxSelectStart.x, boxSelectEnd.x);
    const maxX = Math.max(boxSelectStart.x, boxSelectEnd.x);
    const minY = Math.min(boxSelectStart.y, boxSelectEnd.y);
    const maxY = Math.max(boxSelectStart.y, boxSelectEnd.y);

    const features = map.queryRenderedFeatures(
      [[minX, minY], [maxX, maxY]],
      { layers: ["parcels-fill"] }
    );

    const selectedParcelIds = features
      .map(f => f.properties?.id)
      .filter((id): id is string => !!id);

    if (selectedParcelIds.length > 0) {
      selectParcels(selectedParcelIds);
    }

    setBoxSelectStart(null);
    setBoxSelectEnd(null);
    setSelectMode("none");
  }, [selectMode, boxSelectStart, boxSelectEnd, selectParcels, setSelectMode]);

  // Quick lasso - select parcels in view
  const handleQuickLasso = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const features = map.queryRenderedFeatures(undefined, { layers: ["parcels-fill"] });

    // Select ~20% of visible parcels
    const count = Math.max(5, Math.floor(features.length * 0.2));
    const shuffled = features.sort(() => Math.random() - 0.5);
    const selectedIds = shuffled
      .slice(0, count)
      .map(f => f.properties?.id)
      .filter((id): id is string => !!id);

    selectParcels(selectedIds);
    setSelectMode("none");
  }, [selectParcels, setSelectMode]);

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Find hovered parcel for tooltip
  const hoveredParcel = useMemo(() => {
    return parcels.find((p) => p.id === hoveredParcelId) || null;
  }, [parcels, hoveredParcelId]);

  // Selection box dimensions
  const selectionBox = useMemo(() => {
    if (!boxSelectStart || !boxSelectEnd) return null;
    return {
      x: Math.min(boxSelectStart.x, boxSelectEnd.x),
      y: Math.min(boxSelectStart.y, boxSelectEnd.y),
      width: Math.abs(boxSelectEnd.x - boxSelectStart.x),
      height: Math.abs(boxSelectEnd.y - boxSelectStart.y),
    };
  }, [boxSelectStart, boxSelectEnd]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const handleResetView = useCallback(() => {
    mapRef.current?.flyTo({
      center: BENTON_COUNTY_CENTER,
      zoom: DEFAULT_ZOOM,
    });
  }, []);

  return (
    <TooltipProvider>
      <div className="tf-glass relative h-full min-h-[560px] w-full overflow-hidden rounded-2xl">
        {/* MapLibre Container */}
        <div
          ref={mapContainerRef}
          className={cn(
            "tf-map-canvas",
            (selectMode === "box" || selectMode === "lasso") && "cursor-crosshair"
          )}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={() => {
            setBoxSelectStart(null);
            setBoxSelectEnd(null);
          }}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="text-primary mx-auto mb-3 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {/* Box Selection Overlay */}
        {selectionBox && (
          <div
            className="border-primary bg-primary/10 pointer-events-none absolute z-20 border-2 border-dashed"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}

        {/* Hover Tooltip */}
        <div className="tf-map-tooltip">
          <HoverTooltip
            parcel={hoveredParcel}
            position={tooltipPosition}
            containerRef={mapContainerRef}
          />
        </div>

        {/* Map Controls */}
        <MapControls
          zoom={mapRef.current?.getZoom() ?? DEFAULT_ZOOM}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          layers={layers}
          visibleLayers={visibleLayers}
          onToggleLayer={toggleLayer}
        />

        {/* Legend */}
        <GlassCard className="tf-map-ui bottom-4 left-4 rounded-lg p-3">
          <p className="text-foreground mb-2 text-xs font-semibold">Equity Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground text-xs">Fair (0.95-1.05)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-sky-500" />
              <span className="text-muted-foreground text-xs">{"Progressive (<0.95)"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-amber-500" />
              <span className="text-muted-foreground text-xs">{"Regressive (>1.05)"}</span>
            </div>
          </div>
          <div className="border-border/30 mt-3 border-t pt-2">
            <p className="text-muted-foreground text-xs">
              {parcels.length} parcels loaded
            </p>
          </div>
        </GlassCard>

        {/* Select Mode Indicator */}
        {selectMode !== "none" && (
          <GlassCard className="tf-map-ui top-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg px-4 py-2">
            {selectMode === "lasso" && (
              <>
                <Lasso className="text-primary h-4 w-4" />
                <span className="text-foreground text-sm">Click parcels to add to selection</span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleQuickLasso}
                  className="h-7 px-3 text-xs"
                >
                  Quick Lasso
                </Button>
              </>
            )}
            {selectMode === "box" && (
              <>
                <Square className="text-primary h-4 w-4" />
                <span className="text-foreground text-sm">Drag to draw selection rectangle</span>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectMode("none")}
              className="text-muted-foreground h-7 px-2 text-xs"
            >
              Cancel
            </Button>
          </GlassCard>
        )}
      </div>
    </TooltipProvider>
  );
}
