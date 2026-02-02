"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type SignalState = "official" | "overlay" | "simulated" | "warning" | "blocked" | "success";

export type SignalBadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  state?: SignalState;
};

const STATE_VAR: Record<SignalState, string> = {
  official: "var(--state-official)",
  overlay: "var(--state-overlay)",
  simulated: "var(--state-simulated)",
  warning: "var(--state-warning)",
  blocked: "var(--state-blocked)",
  success: "var(--state-success)",
};

export function SignalBadge({ className, state = "official", ...props }: SignalBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
        "border border-white/10 backdrop-blur-sm",
        "transition-[transform,box-shadow] duration-[var(--dur-1)] ease-[var(--ease-out)]",
        className
      )}
      style={{
        background: `color-mix(in oklab, ${STATE_VAR[state]} 18%, rgba(20,20,22,0.55))`,
        color: "var(--state-official)",
        boxShadow: "var(--glow-weak)",
      }}
      {...props}
    />
  );
}
