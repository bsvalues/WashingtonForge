"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuditLog, type AuditLogEntry } from "@/lib/api";
import { Search, FileText, User, Calendar, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const actionColors: Record<string, string> = {
  LOGIN: "bg-chart-2/20 text-chart-2 border-chart-2/40",
  LOGOUT: "bg-muted/40 text-muted-foreground border-muted/60",
  VIEW_PARCELS: "bg-chart-1/20 text-chart-1 border-chart-1/40",
  RUN_RATIO_STUDY: "bg-chart-4/20 text-chart-4 border-chart-4/40",
  CREATE_SNAPSHOT: "bg-chart-5/20 text-chart-5 border-chart-5/40",
  PUBLISH_SNAPSHOT: "bg-accent/20 text-accent border-accent/40",
  UPLOAD_DATA: "bg-primary/20 text-primary border-primary/40",
};

export function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getAuditLog({ limit: 50 })
        .then(setEntries)
        .catch((err) => console.error("[v0] Failed to load audit log:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const filteredEntries = entries.filter(
    (entry) =>
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.resourceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-panel border-border/50 flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="text-primary h-5 w-5" />
            Audit Log
          </DialogTitle>
        </DialogHeader>

        {/* Search & Filters */}
        <div className="border-border/30 flex items-center gap-3 border-b py-3">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search actions, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input border-border/50 pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="glass-btn border-border/50 text-foreground bg-transparent"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="glass-btn border-border/50 text-foreground bg-transparent"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Log Entries */}
        <div className="flex-1 space-y-2 overflow-y-auto py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              No audit log entries found
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-secondary/30 hover:bg-secondary/50 flex items-center gap-4 rounded-lg p-3 transition-colors"
              >
                {/* Action Badge */}
                <span
                  className={cn(
                    "rounded border px-2 py-1 text-xs font-medium",
                    actionColors[entry.action] ||
                      "bg-muted/40 text-muted-foreground border-muted/60"
                  )}
                >
                  {entry.action.replace(/_/g, " ")}
                </span>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="text-muted-foreground h-3.5 w-3.5" />
                    <span className="text-foreground font-medium">{entry.userName}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {entry.resourceType}: {entry.resourceId}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatTimestamp(entry.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
