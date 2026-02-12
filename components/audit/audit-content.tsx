"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  Filter,
  Calendar,
  User,
  Database,
  FileText,
  Map,
  BarChart3,
  Camera,
  LogIn,
  LogOut,
  Upload,
  Eye,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuditLog, type AuditLogEntry, type AuditAction } from "@/lib/api";

// Action category colors and icons
const actionCategories: Record<string, { color: string; icon: typeof LogIn; label: string }> = {
  AUTH_LOGIN: { color: "bg-green-500/20 text-green-400", icon: LogIn, label: "Login" },
  AUTH_LOGOUT: { color: "bg-gray-500/20 text-gray-400", icon: LogOut, label: "Logout" },
  INGEST_UPLOAD: { color: "bg-blue-500/20 text-blue-400", icon: Upload, label: "Upload" },
  INGEST_VALIDATE: { color: "bg-blue-500/20 text-blue-400", icon: FileText, label: "Validate" },
  INGEST_MAP_FIELDS: { color: "bg-blue-500/20 text-blue-400", icon: Database, label: "Map Fields" },
  INGEST_PREVIEW: { color: "bg-blue-500/20 text-blue-400", icon: Eye, label: "Preview" },
  INGEST_PUBLISH: { color: "bg-blue-500/20 text-blue-400", icon: Upload, label: "Publish" },
  DATASET_CREATE: { color: "bg-purple-500/20 text-purple-400", icon: Database, label: "Create Dataset" },
  DATASET_PUBLISH: { color: "bg-purple-500/20 text-purple-400", icon: Database, label: "Publish Dataset" },
  DATASET_ARCHIVE: { color: "bg-purple-500/20 text-purple-400", icon: Database, label: "Archive Dataset" },
  RATIO_RUN_CREATE: { color: "bg-amber-500/20 text-amber-400", icon: BarChart3, label: "Run Ratio Study" },
  RATIO_RUN_COMPLETE: { color: "bg-amber-500/20 text-amber-400", icon: BarChart3, label: "Ratio Complete" },
  RATIO_EXPORT: { color: "bg-amber-500/20 text-amber-400", icon: Download, label: "Export Ratio" },
  COCKPIT_VIEW: { color: "bg-cyan-500/20 text-cyan-400", icon: Map, label: "View Cockpit" },
  COCKPIT_SELECT: { color: "bg-cyan-500/20 text-cyan-400", icon: Map, label: "Select Parcels" },
  COCKPIT_FILTER: { color: "bg-cyan-500/20 text-cyan-400", icon: Filter, label: "Filter Parcels" },
  SNAPSHOT_CREATE: { color: "bg-pink-500/20 text-pink-400", icon: Camera, label: "Create Snapshot" },
  SNAPSHOT_PUBLISH: { color: "bg-pink-500/20 text-pink-400", icon: Camera, label: "Publish Snapshot" },
  USER_CREATE: { color: "bg-teal-500/20 text-teal-400", icon: User, label: "Create User" },
  USER_UPDATE: { color: "bg-teal-500/20 text-teal-400", icon: User, label: "Update User" },
  ROLE_CHANGE: { color: "bg-teal-500/20 text-teal-400", icon: Sliders, label: "Change Role" },
};

// Fallback for unknown actions
const getActionInfo = (action: AuditAction) => {
  return actionCategories[action] || {
    color: "bg-secondary/50 text-muted-foreground",
    icon: FileText,
    label: action.replace(/_/g, " "),
  };
};

// Format timestamp
const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export function AuditContent() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Load audit log
  useEffect(() => {
    async function loadAuditLog() {
      setIsLoading(true);
      try {
        const data = await getAuditLog({ limit: 100 });
        setEntries(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuditLog();
  }, []);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !entry.userName.toLowerCase().includes(query) &&
        !entry.action.toLowerCase().includes(query) &&
        !entry.resourceId.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedAction && entry.action !== selectedAction) return false;
    if (selectedUser && entry.userId !== selectedUser) return false;
    return true;
  });

  // Get unique actions and users for filters
  const uniqueActions = Array.from(new Set(entries.map((e) => e.action)));
  const uniqueUsers = Array.from(new Set(entries.map((e) => e.userId)));

  // Export audit log
  const handleExport = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Resource Type", "Resource ID", "County", "Details"].join(","),
      ...filteredEntries.map((e) =>
        [
          e.timestamp,
          `"${e.userName}"`,
          e.action,
          e.resourceType,
          e.resourceId,
          e.countyId,
          JSON.stringify(e.details || {}),
        ].join(",")
      ),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
            <p className="text-muted-foreground mt-1">
              Complete audit trail of all system events and user actions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="glass-btn text-foreground bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-panel p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/50"
              />
            </div>
            
            {/* Action Filter */}
            <select
              value={selectedAction || ""}
              onChange={(e) => setSelectedAction(e.target.value || null)}
              className="glass-panel px-3 py-2 rounded-lg text-sm bg-transparent border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {getActionInfo(action as AuditAction).label}
                </option>
              ))}
            </select>
            
            {/* User Filter */}
            <select
              value={selectedUser || ""}
              onChange={(e) => setSelectedUser(e.target.value || null)}
              className="glass-panel px-3 py-2 rounded-lg text-sm bg-transparent border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((userId) => {
                const entry = entries.find((e) => e.userId === userId);
                return (
                  <option key={userId} value={userId}>
                    {entry?.userName || userId}
                  </option>
                );
              })}
            </select>
            
            {/* Clear Filters */}
            {(searchQuery || selectedAction || selectedUser) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedAction(null);
                  setSelectedUser(null);
                }}
                className="text-muted-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredEntries.length} of {entries.length} events
          </span>
          <span>
            <Calendar className="w-4 h-4 inline mr-1" />
            Last 30 days
          </span>
        </div>

        {/* Audit Log Table */}
        <Card className="glass-panel overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Loading audit log...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No audit events found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      County
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredEntries.map((entry) => {
                    const actionInfo = getActionInfo(entry.action);
                    const Icon = actionInfo.icon;
                    
                    return (
                      <tr key={entry.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-foreground font-mono">
                            {formatTimestamp(entry.timestamp)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {entry.userName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.userId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            actionInfo.color
                          )}>
                            <Icon className="w-3.5 h-3.5" />
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {entry.resourceType}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {entry.resourceId}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                          {entry.countyId || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {entry.details ? (
                            <code className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                              {JSON.stringify(entry.details).slice(0, 50)}
                              {JSON.stringify(entry.details).length > 50 && "..."}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
