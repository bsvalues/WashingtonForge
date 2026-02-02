"use client";

import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_MODE } from "@/lib/api";

interface ApiErrorProps {
  error: Error | string;
  onRetry?: () => void;
}

export function ApiError({ error, onRetry }: ApiErrorProps) {
  const errorMessage = typeof error === "string" ? error : error.message;
  const isBackendError =
    errorMessage.includes("Backend not connected") ||
    errorMessage.includes("non-JSON response") ||
    errorMessage.includes("DOCTYPE");

  return (
    <div className="glass-panel mx-auto max-w-md rounded-xl p-8 text-center">
      <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        {isBackendError ? (
          <WifiOff className="text-destructive h-8 w-8" />
        ) : (
          <AlertTriangle className="text-destructive h-8 w-8" />
        )}
      </div>

      <h3 className="text-foreground mb-2 text-lg font-semibold">
        {isBackendError ? "Backend Not Connected" : "Something Went Wrong"}
      </h3>

      <p className="text-muted-foreground mb-4 text-sm">
        {isBackendError ? (
          <>
            The TerraFusion backend service is not available.
            {!DEMO_MODE && (
              <span className="mt-2 block text-xs">
                Set <code className="bg-muted rounded px-1 py-0.5">NEXT_PUBLIC_DEMO_MODE=true</code>{" "}
                to use demo data.
              </span>
            )}
          </>
        ) : (
          errorMessage
        )}
      </p>

      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="glass-btn text-foreground bg-transparent"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}

        {isBackendError && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Wifi className="h-4 w-4" />
            <span>Demo Mode: {DEMO_MODE ? "On" : "Off"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ApiErrorInline({ error }: { error: Error | string }) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div className="bg-destructive/10 border-destructive/30 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-destructive text-sm font-medium">Error</p>
          <p className="text-muted-foreground mt-1 text-sm">{errorMessage}</p>
        </div>
      </div>
    </div>
  );
}
