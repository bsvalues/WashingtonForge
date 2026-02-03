"use client";

import React from "react";

import { memo, useEffect, useState, useRef } from "react";
import type { Parcel } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { PremiumTooltip, SignalBadge } from "@/components/material";

// Phase 1B.0: Hover intent + hysteresis constants
const SHOW_DELAY_MS = 80;
const HIDE_DELAY_MS = 120;
const UPDATE_DEBOUNCE_MS = 60;
const POS_EPS_PX = 4;

type Cursor = { x: number; y: number };

function dist2(a: Cursor, b: Cursor) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

interface HoverTooltipProps {
  parcel: Parcel | null;
  position: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function HoverTooltipComponent({ parcel, position, containerRef }: HoverTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  // Phase 1B.0: Stable visibility + latched content
  const [visible, setVisible] = useState(false);
  const [latchedParcel, setLatchedParcel] = useState<Parcel | null>(null);

  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const updateTimer = useRef<number | null>(null);

  const lastPosRef = useRef<Cursor>({ x: 0, y: 0 });
  const pendingPosRef = useRef<Cursor>({ x: 0, y: 0 });

  // Phase 1B.0: Hover intent + hysteresis (arm on hover, show after delay, hide after grace period)
  useEffect(() => {
    if (parcel) {
      // Cancel hide hysteresis when we re-enter quickly
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = null;

      // Latch immediately (so content is stable once shown)
      setLatchedParcel(parcel);

      // Show after intent delay (only if not already visible)
      if (!visible && !showTimer.current) {
        showTimer.current = window.setTimeout(() => {
          setVisible(true);
          showTimer.current = null;
        }, SHOW_DELAY_MS);
      }
    } else {
      // No hovered target -> cancel any pending show
      if (showTimer.current) window.clearTimeout(showTimer.current);
      showTimer.current = null;

      // Hide after hysteresis delay
      if (visible && !hideTimer.current) {
        hideTimer.current = window.setTimeout(() => {
          setVisible(false);
          setLatchedParcel(null);
          hideTimer.current = null;
        }, HIDE_DELAY_MS);
      }
    }

    return () => {
      if (showTimer.current) window.clearTimeout(showTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      showTimer.current = null;
      hideTimer.current = null;
    };
  }, [parcel, visible]);

  // Phase 1B.0: Debounced position updates (no jitter)
  useEffect(() => {
    if (!position) {
      pendingPosRef.current = { x: 0, y: 0 };
      return;
    }

    pendingPosRef.current = position;

    // If tooltip isn't visible yet, don't spam updates; we snap on show
    if (!visible) return;

    // Debounce position updates to avoid jittery rerenders
    if (updateTimer.current) window.clearTimeout(updateTimer.current);
    updateTimer.current = window.setTimeout(() => {
      const next = pendingPosRef.current;
      const last = lastPosRef.current;

      if (dist2(next, last) < POS_EPS_PX * POS_EPS_PX) return;

      lastPosRef.current = next;
      // Trigger recompute of adjusted position
      setAdjustedPosition(null);
    }, UPDATE_DEBOUNCE_MS);

    return () => {
      if (updateTimer.current) window.clearTimeout(updateTimer.current);
      updateTimer.current = null;
    };
  }, [position, visible]);

  // Clamp tooltip to viewport edges
  useEffect(() => {
    if (!visible || !latchedParcel || !position || !tooltipRef.current || !containerRef.current) {
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
  }, [position, visible, latchedParcel, containerRef]);

  // Don't render until visible + have latched content
  if (!visible || !latchedParcel || !position) {
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
        "pointer-events-none absolute z-50",
        "transition-[opacity,transform] duration-[var(--dur-1)] ease-[var(--ease-out)]",
        visible && adjustedPosition ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
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
            <p className="text-foreground font-mono text-sm font-semibold">{latchedParcel.parcelId}</p>
            <p className="text-muted-foreground max-w-40 truncate text-xs">{latchedParcel.situs}</p>
          </div>
          <SignalBadge state={getEquityState(latchedParcel.equityStatus)} className="capitalize">
            {latchedParcel.equityStatus}
          </SignalBadge>
        </div>

        {/* Data Grid */}
        <div className="border-border/30 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-2 text-xs">
          <span className="text-muted-foreground">Class</span>
          <span className="text-foreground font-medium">{latchedParcel.propertyClass}</span>

          <span className="text-muted-foreground">Assessed Value</span>
          <span className="text-foreground font-medium">${latchedParcel.totalValue.toLocaleString()}</span>

          <span className="text-muted-foreground">Sale Price</span>
          <span className="text-foreground font-medium">
            {latchedParcel.salePrice ? `$${latchedParcel.salePrice.toLocaleString()}` : "No Sale"}
          </span>

          <span className="text-muted-foreground">Ratio</span>
          <span className="text-foreground font-mono font-semibold">
            {latchedParcel.ratio?.toFixed(3) || "N/A"}
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
