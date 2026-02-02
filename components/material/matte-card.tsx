"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type MatteCardProps = React.HTMLAttributes<HTMLDivElement>;

export function MatteCard({ className, ...props }: MatteCardProps) {
  return (
    <div
      className={cn(
        "tf-matte text-foreground",
        "transition-[transform,box-shadow,border-color] duration-[var(--dur-2)] ease-[var(--ease-out)]",
        className
      )}
      {...props}
    />
  );
}
