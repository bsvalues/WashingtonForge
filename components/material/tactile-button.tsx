"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type TactileButtonProps = React.ComponentProps<typeof Button>;

export function TactileButton({ className, ...props }: TactileButtonProps) {
  return (
    <Button
      className={cn(
        "relative",
        "transition-[transform,box-shadow,filter] duration-[var(--dur-1)] ease-[var(--ease-out)]",
        "shadow-[var(--z1-shadow)]",
        "active:translate-y-[0.5px] active:scale-[0.99]",
        className
      )}
      {...props}
    />
  );
}
