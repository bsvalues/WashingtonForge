"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export type GlassButtonProps = ButtonProps & {
  tone?: "default" | "primary";
};

export function GlassButton({ className, tone = "default", ...props }: GlassButtonProps) {
  return (
    <Button
      className={cn("tf-glass-btn", tone === "primary" && "tf-glass-btn--primary", className)}
      {...props}
    />
  );
}
