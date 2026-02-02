"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type DrawerShellProps = React.HTMLAttributes<HTMLDivElement> & {
  strength?: "normal" | "strong";
};

export function DrawerShell({ className, strength = "normal", ...props }: DrawerShellProps) {
  return (
    <div
      className={cn(
        "tf-glass",
        strength === "strong" && "tf-glass--strong",
        "overflow-hidden",
        className
      )}
      {...props}
    />
  );
}
