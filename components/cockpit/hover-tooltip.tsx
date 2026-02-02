"use client";

import React from "react";

import { memo, useEffect, useState, useRef } from "react";
import type { Parcel } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { PremiumTooltip, SignalBadge } from "@/components/material";

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

  const getEquityState = (status: Parcel["equityStatus"]) => {
    switch (status) {
      case "fair":
        return "success";
      case "progressive":
        return "overlay";
      case "regressive":
        return "warning";
      default:
        return "official";
    }
  };

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "pointer-events-none absolute z-50 transition-opacity duration-100",
        adjustedPosition ? "opacity-100" : "opacity-0"
      )}
      style={{
        left: adjustedPosition?.x ?? position.x,
        top: adjustedPosition?.y ?? position.y,
      }}
    >
      <PremiumTooltip className="min-w-56 p-3">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-foreground font-mono text-sm font-semibold">{parcel.parcelId}</p>
            <p className="text-muted-foreground max-w-40 truncate text-xs">{parcel.situs}</p>
          </div>
          <SignalBadge state={getEquityState(parcel.equityStatus)} className="capitalize">
            {parcel.equityStatus}
          </SignalBadge>
        </div>

        {/* Data Grid */}
        <div className="border-border/30 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-2 text-xs">
          <span className="text-muted-foreground">Class</span>
          <span className="text-foreground font-medium">{parcel.propertyClass}</span>

          <span className="text-muted-foreground">Assessed Value</span>
          <span className="text-foreground font-medium">${parcel.totalValue.toLocaleString()}</span>

          <span className="text-muted-foreground">Sale Price</span>
          <span className="text-foreground font-medium">
            {parcel.salePrice ? `$${parcel.salePrice.toLocaleString()}` : "No Sale"}
          </span>

          <span className="text-muted-foreground">Ratio</span>
          <span className="text-foreground font-mono font-semibold">
            {parcel.ratio?.toFixed(3) || "N/A"}
          </span>
        </div>

        {/* Footer hint */}
        <div className="border-border/30 text-muted-foreground mt-2 border-t pt-2 text-xs">
          Click to select | Shift+Click to multi-select
        </div>
      </PremiumTooltip>
    </div>
  );
}

// Memoize to prevent rerender storms
export const HoverTooltip = memo(HoverTooltipComponent);
