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
  const isBackendError = errorMessage.includes("Backend not connected") || 
                          errorMessage.includes("non-JSON response") ||
                          errorMessage.includes("DOCTYPE");

  return (
    <div className="glass-panel rounded-xl p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        {isBackendError ? (
          <WifiOff className="w-8 h-8 text-destructive" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-destructive" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {isBackendError ? "Backend Not Connected" : "Something Went Wrong"}
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        {isBackendError ? (
          <>
            The TerraFusion backend service is not available.
            {!DEMO_MODE && (
              <span className="block mt-2 text-xs">
                Set <code className="px-1 py-0.5 rounded bg-muted">NEXT_PUBLIC_DEMO_MODE=true</code> to use demo data.
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
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}

        {isBackendError && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="w-4 h-4" />
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
    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">Error</p>
          <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
        </div>
      </div>
    </div>
  );
}
