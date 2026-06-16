"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { repository, getStorageStats, clearStorage } from "@/lib/data-suite";
import type { WACountyFips, DataProductType } from "@/lib/data-suite";
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataPlaneStatusProps {
  countyFips: WACountyFips;
  subscriber: string;
  product?: DataProductType;
  className?: string;
}

/**
 * Data Plane Status Component
 * 
 * Shows the real state of data delivery for debugging and verification.
 * This is the "receipt checker" - it proves data was actually delivered.
 */
export function DataPlaneStatus({
  countyFips,
  subscriber,
  product = "COUNTY_ROLL",
  className,
}: DataPlaneStatusProps) {
  const [status, setStatus] = useState<{
    initialized: boolean;
    hasPointer: boolean;
    versionId: string | null;
    activatedAt: string | null;
    activatedBy: string | null;
    routeRecordCount: number;
    storageKeys: number;
    storageSize: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStatus = async () => {
    setIsRefreshing(true);
    try {
      const repoStats = repository.getStats();
      const storageStats = getStorageStats();
      
      const pointer = await repository.getActiveDataset(subscriber, countyFips, product);
      const records = await repository.getRouteRecords(subscriber, countyFips, product, 100);

      setStatus({
        initialized: repoStats.initialized,
        hasPointer: pointer?.active_version_id !== null && pointer?.active_version_id !== undefined,
        versionId: pointer?.active_version_id || null,
        activatedAt: pointer?.activated_at || null,
        activatedBy: pointer?.activated_by || null,
        routeRecordCount: records.length,
        storageKeys: storageStats.keys.length,
        storageSize: `${(storageStats.totalSize / 1024).toFixed(1)} KB`,
      });
    } catch (error) {
      console.error("[DataPlaneStatus] Error loading status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [countyFips, subscriber, product]);

  const handleClearStorage = () => {
    if (confirm("This will clear all data suite storage. Continue?")) {
      clearStorage();
      repository.clear();
      loadStatus();
    }
  };

  if (!status) {
    return (
      <Card className={cn("p-4 animate-pulse", className)}>
        <div className="h-20 bg-muted rounded" />
      </Card>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Data Plane Status</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStatus}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearStorage}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {/* Active Pointer */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Active Pointer:</span>
          <div className="flex items-center gap-1">
            {status.hasPointer ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-mono">{status.versionId?.slice(0, 12)}...</span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-red-500" />
                <span className="text-red-500">No pointer</span>
              </>
            )}
          </div>
        </div>

        {/* Route Records */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Route Records:</span>
          <Badge variant={status.routeRecordCount > 0 ? "default" : "secondary"}>
            {status.routeRecordCount}
          </Badge>
        </div>

        {/* Activated By */}
        {status.activatedBy && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Activated By:</span>
            <span className="font-mono">{status.activatedBy.slice(0, 20)}</span>
          </div>
        )}

        {/* Activated At */}
        {status.activatedAt && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Activated At:</span>
            <span className="font-mono">{new Date(status.activatedAt).toLocaleTimeString()}</span>
          </div>
        )}

        {/* Storage Stats */}
        <div className="pt-2 mt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <HardDrive className="h-3 w-3" />
            <span>Storage</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Keys:</span>
            <span>{status.storageKeys}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span>{status.storageSize}</span>
          </div>
        </div>

        {/* Subscriber/Product Info */}
        <div className="pt-2 mt-2 border-t border-border/50 text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Subscriber:</span>
            <span className="font-mono">{subscriber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Product:</span>
            <span className="font-mono">{product}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>County:</span>
            <span className="font-mono">{countyFips}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
