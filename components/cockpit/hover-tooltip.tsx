"use client";

import React from "react"

import { memo, useEffect, useState, useRef } from "react";
import type { Parcel } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface HoverTooltipProps {
  parcel: Parcel | null;
  position: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function HoverTooltipComponent({ parcel, position, containerRef }: HoverTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  // Clamp tooltip to viewport edges
  useEffect(() => {
    if (!position || !tooltipRef.current || !containerRef.current) {
      setAdjustedPosition(null);
      return;
    }

    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const padding = 12;
    let x = position.x + 16; // Offset from cursor
    let y = position.y - 8;

    // Clamp right edge
    if (x + tooltipRect.width > containerRect.width - padding) {
      x = position.x - tooltipRect.width - 16;
    }

    // Clamp left edge
    if (x < padding) {
      x = padding;
    }

    // Clamp bottom edge
    if (y + tooltipRect.height > containerRect.height - padding) {
      y = containerRect.height - tooltipRect.height - padding;
    }

    // Clamp top edge
    if (y < padding) {
      y = padding;
    }

    setAdjustedPosition({ x, y });
  }, [position, containerRef]);

  if (!parcel || !position) {
    return null;
  }

  const getEquityColor = (status: Parcel["equityStatus"]) => {
    switch (status) {
      case "fair":
        return "text-emerald-400";
      case "progressive":
        return "text-sky-400";
      case "regressive":
        return "text-amber-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getEquityBg = (status: Parcel["equityStatus"]) => {
    switch (status) {
      case "fair":
        return "bg-emerald-500/20 border-emerald-500/30";
      case "progressive":
        return "bg-sky-500/20 border-sky-500/30";
      case "regressive":
        return "bg-amber-500/20 border-amber-500/30";
      default:
        return "bg-muted/20 border-muted/30";
    }
  };

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "absolute z-50 pointer-events-none transition-opacity duration-100",
        adjustedPosition ? "opacity-100" : "opacity-0"
      )}
      style={{
        left: adjustedPosition?.x ?? position.x,
        top: adjustedPosition?.y ?? position.y,
      }}
    >
      <div className="glass-panel rounded-lg p-3 min-w-56 shadow-xl border border-border/50">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-mono font-semibold text-foreground text-sm">
              {parcel.parcelId}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-40">
              {parcel.situs}
            </p>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium border capitalize shrink-0",
              getEquityBg(parcel.equityStatus),
              getEquityColor(parcel.equityStatus)
            )}
          >
            {parcel.equityStatus}
          </span>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-border/30 pt-2">
          <span className="text-muted-foreground">Class</span>
          <span className="text-foreground font-medium">{parcel.propertyClass}</span>

          <span className="text-muted-foreground">Assessed Value</span>
          <span className="text-foreground font-medium">
            ${parcel.totalValue.toLocaleString()}
          </span>

          <span className="text-muted-foreground">Sale Price</span>
          <span className="text-foreground font-medium">
            {parcel.salePrice ? `$${parcel.salePrice.toLocaleString()}` : "No Sale"}
          </span>

          <span className="text-muted-foreground">Ratio</span>
          <span className={cn("font-mono font-semibold", getEquityColor(parcel.equityStatus))}>
            {parcel.ratio?.toFixed(3) || "N/A"}
          </span>
        </div>

        {/* Footer hint */}
        <div className="mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
          Click to select | Shift+Click to multi-select
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent rerender storms
export const HoverTooltip = memo(HoverTooltipComponent);
