"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  strength?: "normal" | "strong";
};

export function GlassCard({ className, strength = "normal", ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "tf-glass text-foreground",
        strength === "strong" && "tf-glass--strong",
        "transition-[transform,box-shadow,border-color,background-color] duration-[var(--dur-2)] ease-[var(--ease-out)]",
        className
      )}
      {...props}
    />
  );
}
