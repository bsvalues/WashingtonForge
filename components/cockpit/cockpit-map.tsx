"use client";

import React from "react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Loader2, Lasso, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlassCard } from "@/components/material";
import { HoverTooltip } from "./hover-tooltip";
import { MapControls } from "./map-controls";
import { useSelection } from "@/lib/selection";
import { getMapLayers, type ParcelFilter, type Parcel, type MapLayer } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CockpitMapProps {
  filters: ParcelFilter;
  parcels: Parcel[];
  onZoomToParcel?: (parcel: Parcel) => void;
}

// Extended parcel type with position for SVG rendering
interface ParcelWithPosition extends Parcel {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Generate mock positions for parcels
function generateParcelPositions(parcels: Parcel[]): ParcelWithPosition[] {
  const gridSize = Math.ceil(Math.sqrt(parcels.length));
  const cellWidth = 90 / gridSize;
  const cellHeight = 90 / gridSize;

  return parcels.map((parcel, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    // Add some randomness to make it look more natural
    const offsetX = (Math.random() - 0.5) * (cellWidth * 0.2);
    const offsetY = (Math.random() - 0.5) * (cellHeight * 0.2);

    return {
      ...parcel,
      x: 5 + col * cellWidth + offsetX,
      y: 5 + row * cellHeight + offsetY,
      width: cellWidth * 0.85,
      height: cellHeight * 0.85,
    };
  });
}

export function CockpitMap({ filters, parcels, onZoomToParcel }: CockpitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(["drift-hotspots"]));
  const [zoom, setZoom] = useState(1);
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
    selectMode,
    setSelectMode,
    singleSelectMode,
  } = useSelection();

  // Generate positioned parcels with memoization
  const positionedParcels = useMemo(() => {
    return generateParcelPositions(parcels);
  }, [parcels]);

  // Load map layers
  useEffect(() => {
    async function loadLayers() {
      try {
        const mapLayers = await getMapLayers();
        setLayers(mapLayers);
      } catch (err) {
        // Silently handle
      }
    }
    loadLayers();
  }, []);

  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleParcelMouseEnter = useCallback(
    (parcel: ParcelWithPosition, event: React.MouseEvent) => {
      if (selectMode !== "none") return;

      setHoveredParcel(parcel.id);
      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    },
    [selectMode, setHoveredParcel]
  );

  const handleParcelMouseLeave = useCallback(() => {
    setHoveredParcel(null);
    setTooltipPosition(null);
  }, [setHoveredParcel]);

  // Phase 1B.0: Throttle cursor position updates to reduce rerender frequency
  const cursorThrottleRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);

  const handleParcelMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (selectMode !== "none") return;

      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const pos = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        pendingCursorRef.current = pos;

        // Throttle updates to ~50ms
        if (cursorThrottleRef.current) return;

        cursorThrottleRef.current = window.setTimeout(() => {
          if (pendingCursorRef.current) {
            setTooltipPosition(pendingCursorRef.current);
          }
          cursorThrottleRef.current = null;
        }, 50);
      }
    },
    [selectMode]
  );

  // Cleanup throttle timer on unmount
  useEffect(() => {
    return () => {
      if (cursorThrottleRef.current) window.clearTimeout(cursorThrottleRef.current);
    };
  }, []);

  const handleParcelClick = useCallback(
    (parcel: ParcelWithPosition, event: React.MouseEvent) => {
      event.stopPropagation();

      if (selectMode === "lasso") {
        // In lasso mode, toggle selection
        toggleParcel(parcel.id);
      } else if (selectMode === "box") {
        // Box mode handled separately
        return;
      } else {
        // Normal click behavior
        selectParcel(parcel.id, event.shiftKey);
      }
    },
    [selectMode, selectParcel, toggleParcel]
  );

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
    if (selectMode !== "box" || !boxSelectStart || !boxSelectEnd) {
      setBoxSelectStart(null);
      setBoxSelectEnd(null);
      return;
    }

    // Calculate selection box in SVG coordinates
    const container = mapContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const svgWidth = rect.width;
    const svgHeight = rect.height;

    // Convert pixel coordinates to viewBox coordinates (0-100)
    const minX = (Math.min(boxSelectStart.x, boxSelectEnd.x) / svgWidth) * 100;
    const maxX = (Math.max(boxSelectStart.x, boxSelectEnd.x) / svgWidth) * 100;
    const minY = (Math.min(boxSelectStart.y, boxSelectEnd.y) / svgHeight) * 100;
    const maxY = (Math.max(boxSelectStart.y, boxSelectEnd.y) / svgHeight) * 100;

    // Find parcels within the box
    const selectedIds: string[] = [];
    for (const parcel of positionedParcels) {
      const parcelCenterX = parcel.x + parcel.width / 2;
      const parcelCenterY = parcel.y + parcel.height / 2;

      if (
        parcelCenterX >= minX &&
        parcelCenterX <= maxX &&
        parcelCenterY >= minY &&
        parcelCenterY <= maxY
      ) {
        selectedIds.push(parcel.id);
      }
    }

    if (selectedIds.length > 0) {
      selectParcels(selectedIds);
    }

    setBoxSelectStart(null);
    setBoxSelectEnd(null);
    setSelectMode("none");
  }, [selectMode, boxSelectStart, boxSelectEnd, positionedParcels, selectParcels, setSelectMode]);

  // Quick lasso - select a cluster of nearby parcels
  const handleQuickLasso = useCallback(() => {
    // For prototype: select ~20% of parcels randomly clustered
    const clusterSize = Math.max(5, Math.floor(positionedParcels.length * 0.2));
    const startIndex = Math.floor(Math.random() * (positionedParcels.length - clusterSize));
    const selectedIds = positionedParcels
      .slice(startIndex, startIndex + clusterSize)
      .map((p) => p.id);
    selectParcels(selectedIds);
    setSelectMode("none");
  }, [positionedParcels, selectParcels, setSelectMode]);

  const getParcelColor = (status: Parcel["equityStatus"]) => {
    switch (status) {
      case "fair":
        return { fill: "fill-emerald-500/30", stroke: "stroke-emerald-500" };
      case "progressive":
        return { fill: "fill-sky-500/30", stroke: "stroke-sky-500" };
      case "regressive":
        return { fill: "fill-amber-500/30", stroke: "stroke-amber-500" };
      default:
        return { fill: "fill-muted/30", stroke: "stroke-muted" };
    }
  };

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

  const hoveredParcel = useMemo(() => {
    return positionedParcels.find((p) => p.id === hoveredParcelId) || null;
  }, [positionedParcels, hoveredParcelId]);

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

  return (
    <TooltipProvider>
      <div className="tf-glass relative h-full min-h-[560px] w-full overflow-hidden rounded-2xl">
        {/* Map Container - tf-map-canvas ensures it sits above glass pseudo-elements */}
        <div
          ref={mapContainerRef}
          className={cn(
            "tf-map-canvas",
            (selectMode === "box" || selectMode === "lasso") && "cursor-crosshair"
          )}
          style={{
            background: `
              radial-gradient(ellipse at 30% 40%, oklch(0.12 0.03 220 / 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, oklch(0.10 0.02 260 / 0.3) 0%, transparent 50%),
              linear-gradient(to bottom, oklch(0.06 0.015 250) 0%, oklch(0.04 0.01 250) 100%)
            `,
          }}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={() => {
            setBoxSelectStart(null);
            setBoxSelectEnd(null);
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="text-primary mx-auto mb-3 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">Loading parcels...</p>
              </div>
            </div>
          )}

          {/* Interactive Map */}
          {!isLoading && (
            <div className="absolute inset-0">
              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, oklch(0.5 0.05 260) 1px, transparent 1px),
                    linear-gradient(to bottom, oklch(0.5 0.05 260) 1px, transparent 1px)
                  `,
                  backgroundSize: "60px 60px",
                }}
              />

              {/* SVG Parcels */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {positionedParcels.map((parcel) => {
                  const colors = getParcelColor(parcel.equityStatus);
                  const selected = isSelected(parcel.id);
                  const hovered = hoveredParcelId === parcel.id;

                  return (
                    <g key={parcel.id}>
                      {/* Phase 1B.1B-1: Magnetic selection ring with outer glow */}
                      {selected && (
                        <>
                          {/* Outer glow (subtle) */}
                          <rect
                            x={parcel.x - 0.8}
                            y={parcel.y - 0.8}
                            width={parcel.width + 1.6}
                            height={parcel.height + 1.6}
                            className="fill-primary/10 stroke-primary/40 stroke-[0.6] blur-[0.3px]"
                            rx={0.6}
                          />
                          {/* Crisp rim */}
                          <rect
                            x={parcel.x - 0.4}
                            y={parcel.y - 0.4}
                            width={parcel.width + 0.8}
                            height={parcel.height + 0.8}
                            className="stroke-primary fill-none stroke-[0.5]"
                            rx={0.5}
                          />
                        </>
                      )}

                      {/* Phase 1B.1B-1: Hover ring (dimmer, only when not selected) */}
                      {hovered && !selected && (
                        <rect
                          x={parcel.x - 0.3}
                          y={parcel.y - 0.3}
                          width={parcel.width + 0.6}
                          height={parcel.height + 0.6}
                          className="stroke-primary/60 fill-none stroke-[0.4]"
                          rx={0.4}
                        />
                      )}

                      {/* Parcel polygon */}
                      <rect
                        x={parcel.x}
                        y={parcel.y}
                        width={parcel.width}
                        height={parcel.height}
                        className={cn(
                          "transition-all duration-100",
                          selectMode === "none" && "cursor-pointer",
                          colors.fill,
                          colors.stroke,
                          "stroke-[0.3]",
                          hovered && !selected && "brightness-110",
                          selected && "brightness-105"
                        )}
                        rx={0.3}
                        onMouseEnter={(e) => handleParcelMouseEnter(parcel, e)}
                        onMouseLeave={handleParcelMouseLeave}
                        onMouseMove={handleParcelMouseMove}
                        onClick={(e) => handleParcelClick(parcel, e)}
                      />

                      {/* Ratio label on hover/select */}
                      {(hovered || selected) && (
                        <text
                          x={parcel.x + parcel.width / 2}
                          y={parcel.y + parcel.height / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground pointer-events-none text-[1.8px] font-semibold"
                        >
                          {parcel.ratio?.toFixed(2) || "—"}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

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
            </div>
          )}
        </div>

        {/* Hover Tooltip - tf-map-tooltip ensures highest z-index in map context */}
        <div className="tf-map-tooltip">
          <HoverTooltip
            parcel={hoveredParcel}
            position={tooltipPosition}
            containerRef={mapContainerRef}
          />
        </div>

        {/* Map Controls */}
        <MapControls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 2))}
          onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
          onResetView={() => setZoom(1)}
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
              {positionedParcels.length} parcels shown
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
