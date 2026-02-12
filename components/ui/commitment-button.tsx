"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * CommitmentButton -- Tactile Maximalism
 *
 * Used ONLY for high-stakes actions:
 *   Run | Publish | Certify | Export | Approve Calibration | Generate Defense Packet
 *
 * Features:
 *   - Spring-physics press animation (CSS .commitment-btn)
 *   - Visual weight: raised shadow, subtle glow, stronger border
 *   - Optional loading spinner
 *   - Destructive variant for irreversible actions
 *   - Respects prefers-reduced-motion via CSS
 */

interface CommitmentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "destructive";
  loading?: boolean;
  icon?: React.ReactNode;
}

const CommitmentButton = React.forwardRef<
  HTMLButtonElement,
  CommitmentButtonProps
>(
  (
    {
      className,
      children,
      variant = "primary",
      loading = false,
      icon,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "commitment-btn",
          variant === "destructive" &&
            "commitment-btn commitment-btn--destructive",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="h-4 w-4 flex items-center justify-center">
            {icon}
          </span>
        ) : null}
        {children}
      </button>
    );
  }
);

CommitmentButton.displayName = "CommitmentButton";

export { CommitmentButton, type CommitmentButtonProps };
