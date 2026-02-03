"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type PremiumTooltipProps = React.HTMLAttributes<HTMLDivElement>;

export function PremiumTooltip({ className, ...props }: PremiumTooltipProps) {
  return (
    <div
      className={cn(
        "tf-glass tf-glass--strong",
        "rounded-[var(--r-md)] px-3 py-2 text-xs leading-snug",
        "shadow-[var(--z3-shadow)]",
        "pointer-events-none select-none",
        className
      )}
      {...props}
    />
  );
}
