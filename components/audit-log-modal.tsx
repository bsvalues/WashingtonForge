"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuditLog, type AuditLogEntry } from "@/lib/api";
import {
  Search,
  FileText,
  User,
  Calendar,
  Filter,
  Download,
} from "lucide-react";
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
      <DialogContent className="glass-panel border-border/50 max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-primary" />
            Audit Log
          </DialogTitle>
        </DialogHeader>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 py-3 border-b border-border/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search actions, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-input border-border/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="glass-btn border-border/50 text-foreground bg-transparent"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="glass-btn border-border/50 text-foreground bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto space-y-2 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit log entries found
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                {/* Action Badge */}
                <span
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium border",
                    actionColors[entry.action] || "bg-muted/40 text-muted-foreground border-muted/60"
                  )}
                >
                  {entry.action.replace(/_/g, " ")}
                </span>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      {entry.userName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {entry.resourceType}: {entry.resourceId}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
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
