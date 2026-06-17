"use client";

import { useEffect, useState } from "react";
import {
  Database,
  Map,
  Target,
  BarChart3,
  Zap,
  Scale,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { eventBus, type DataSuiteEvent, type DataProductType, DATA_PRODUCTS } from "@/lib/data-suite";

/**
 * RoutingFlowDiagram - Visual representation of data flow through TerraFusion
 * 
 * Shows:
 * - Data products (sources)
 * - Module subscribers (targets)  
 * - Real-time routing activity
 * - Success/failure status
 */

interface RoutingFlowDiagramProps {
  countyFips?: string;
  showLegend?: boolean;
}

// Module definitions with their data dependencies
const MODULES = [
  {
    id: "cockpit-map",
    name: "Cockpit Map",
    icon: Map,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    subscribesTo: ["PARCEL_FABRIC", "COUNTY_ROLL", "BUILDINGS"] as DataProductType[],
  },
  {
    id: "comps-engine",
    name: "Comps Engine",
    icon: Target,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/30",
    subscribesTo: ["PARCEL_FABRIC", "COUNTY_ROLL", "SALES_STREAM", "BUILDINGS"] as DataProductType[],
  },
  {
    id: "ratio-studies",
    name: "Ratio Studies",
    icon: BarChart3,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/30",
    subscribesTo: ["COUNTY_ROLL", "SALES_STREAM"] as DataProductType[],
  },
  {
    id: "calibration",
    name: "Calibration",
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    subscribesTo: ["COUNTY_ROLL", "SALES_STREAM"] as DataProductType[],
  },
  {
    id: "appeals",
    name: "Appeals",
    icon: Scale,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/30",
    subscribesTo: ["COUNTY_ROLL"] as DataProductType[],
  },
];

const PRODUCTS: { type: DataProductType; name: string; color: string }[] = [
  { type: "PARCEL_FABRIC", name: "Parcel Fabric", color: "text-cyan-400" },
  { type: "COUNTY_ROLL", name: "County Roll", color: "text-green-400" },
  { type: "SALES_STREAM", name: "Sales Stream", color: "text-orange-400" },
  { type: "BUILDINGS", name: "Buildings", color: "text-pink-400" },
];

type RoutingStatus = "idle" | "routing" | "success" | "error";

export function RoutingFlowDiagram({ countyFips, showLegend = true }: RoutingFlowDiagramProps) {
  // Track routing status for each product->module connection
  const [routingStatus, setRoutingStatus] = useState<
    Record<string, { status: RoutingStatus; timestamp?: string }>
  >({});
  const [recentEvents, setRecentEvents] = useState<DataSuiteEvent[]>([]);

  // Subscribe to routing events
  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event) => {
      if (event.type === "product.published") {
        const payload = event.payload as { product: DataProductType; routingResults: Array<{ subscriber: string; success: boolean }> };
        
        // Mark all connections for this product as routing
        const updates: Record<string, { status: RoutingStatus; timestamp?: string }> = {};
        for (const dataModule of MODULES) {
          if (dataModule.subscribesTo.includes(payload.product)) {
            const key = `${payload.product}-${dataModule.id}`;
            updates[key] = { status: "routing" };
          }
        }
        setRoutingStatus((prev) => ({ ...prev, ...updates }));

        // After delay, show results
        setTimeout(() => {
          const results: Record<string, { status: RoutingStatus; timestamp?: string }> = {};
          for (const result of payload.routingResults || []) {
            const key = `${payload.product}-${result.subscriber}`;
            results[key] = {
              status: result.success ? "success" : "error",
              timestamp: new Date().toISOString(),
            };
          }
          setRoutingStatus((prev) => ({ ...prev, ...results }));
        }, 1000);
      }

      if (event.type === "routing.completed" || event.type === "product.published") {
        setRecentEvents((prev) => [event, ...prev].slice(0, 5));
      }
    });

    return unsubscribe;
  }, []);

  const getConnectionStatus = (product: DataProductType, moduleId: string): RoutingStatus => {
    return routingStatus[`${product}-${moduleId}`]?.status || "idle";
  };

  return (
    <div className="space-y-6">
      {/* Flow Diagram */}
      <Card className="tf-glass p-6">
        <h3 className="text-foreground mb-6 text-lg font-semibold">Data Routing Flow</h3>
        
        <div className="relative">
          {/* Products Column */}
          <div className="grid grid-cols-3 gap-8">
            {/* Left: Products */}
            <div className="space-y-4">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                Data Products
              </p>
              {PRODUCTS.map((product) => (
                <div
                  key={product.type}
                  className="bg-muted/20 border-border/50 flex items-center gap-3 rounded-lg border p-3"
                >
                  <Database className={cn("h-5 w-5", product.color)} />
                  <span className="text-foreground text-sm font-medium">{product.name}</span>
                </div>
              ))}
            </div>

            {/* Center: Connections */}
            <div className="flex items-center justify-center">
              <div className="space-y-2">
                <ArrowRight className="text-muted-foreground mx-auto h-8 w-8" />
                <p className="text-muted-foreground text-center text-xs">Routing</p>
              </div>
            </div>

            {/* Right: Modules */}
            <div className="space-y-4">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                Module Subscribers
              </p>
              {MODULES.map((module) => {
                // Check if any product is currently routing to this module
                const isReceiving = PRODUCTS.some(
                  (p) => getConnectionStatus(p.type, module.id) === "routing"
                );
                const hasSuccess = PRODUCTS.some(
                  (p) => getConnectionStatus(p.type, module.id) === "success"
                );

                return (
                  <div
                    key={module.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
                      module.bgColor,
                      module.borderColor,
                      isReceiving && "ring-2 ring-blue-400/50"
                    )}
                  >
                    <module.icon className={cn("h-5 w-5", module.color)} />
                    <span className="text-foreground flex-1 text-sm font-medium">{module.name}</span>
                    {isReceiving && (
                      <Clock className="h-4 w-4 animate-pulse text-blue-400" />
                    )}
                    {hasSuccess && !isReceiving && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Connection Matrix */}
      <Card className="tf-glass overflow-hidden">
        <div className="border-border/50 border-b p-4">
          <h3 className="text-foreground font-medium">Routing Matrix</h3>
          <p className="text-muted-foreground text-sm">
            Which modules receive updates from each data product
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-border/50 border-b">
                <th className="text-muted-foreground p-3 text-left text-xs font-medium">
                  Product
                </th>
                {MODULES.map((m) => (
                  <th key={m.id} className="p-3 text-center">
                    <m.icon className={cn("mx-auto h-4 w-4", m.color)} />
                    <span className="text-muted-foreground mt-1 block text-xs">{m.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((product) => (
                <tr key={product.type} className="border-border/50 border-b last:border-0">
                  <td className="p-3">
                    <span className={cn("text-sm font-medium", product.color)}>
                      {product.name}
                    </span>
                  </td>
                  {MODULES.map((dataModule) => {
                    const isSubscribed = dataModule.subscribesTo.includes(product.type);
                    const status = getConnectionStatus(product.type, dataModule.id);

                    return (
                      <td key={dataModule.id} className="p-3 text-center">
                        {isSubscribed ? (
                          <div
                            className={cn(
                              "mx-auto flex h-6 w-6 items-center justify-center rounded-full transition-all",
                              status === "idle" && "bg-emerald-400/20",
                              status === "routing" && "bg-blue-400/20 animate-pulse",
                              status === "success" && "bg-emerald-400/30",
                              status === "error" && "bg-red-400/20"
                            )}
                          >
                            {status === "idle" && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            {status === "routing" && (
                              <Clock className="h-3.5 w-3.5 animate-spin text-blue-400" />
                            )}
                            {status === "success" && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            {status === "error" && (
                              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      {recentEvents.length > 0 && (
        <Card className="tf-glass p-4">
          <h4 className="text-foreground mb-3 text-sm font-medium">Recent Routing Activity</h4>
          <div className="space-y-2">
            {recentEvents.map((event, i) => (
              <div
                key={i}
                className="bg-muted/20 flex items-center gap-3 rounded-lg p-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-foreground">
                  {event.type === "product.published"
                    ? `Published ${(event.payload as Record<string, unknown>).product}`
                    : `Routed to ${(event.payload as Record<string, unknown>).subscriber}`}
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-400/30" />
            <span className="text-muted-foreground">Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-blue-400/30" />
            <span className="text-muted-foreground">Routing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400/30" />
            <span className="text-muted-foreground">Error</span>
          </div>
        </div>
      )}
    </div>
  );
}
