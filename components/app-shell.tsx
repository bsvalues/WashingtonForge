"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Map,
  Upload,
  BarChart3,
  Building2,
  LogOut,
  Camera,
  LayoutDashboard,
  Sliders,
  ScrollText,
  Database,
  Zap,
  Shield,
  Settings2,
  Search,
  PanelRightOpen,
  PanelRightClose,
  Radio,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditLogModal } from "@/components/audit-log-modal";
import { SnapshotModal } from "@/components/snapshot-modal";
import { TerraPilotPanel } from "@/components/pilot/terra-pilot-panel";
import { CommandPalette } from "@/components/pilot/command-palette";
import { TraceFeedDrawer } from "@/components/trace/trace-feed-drawer";
import { PolicyDebugDrawer } from "@/components/pilot/policy-debug-drawer";
import {
  type ToolDescriptor,
  TOOL_REGISTRY,
  ALL_CLAIMS,
} from "@/lib/pilot/tools";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: string;
    county: string;
  };
}

const dockItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cockpit", label: "Cockpit", icon: Map },
  { href: "/ingest", label: "Ingest", icon: Upload },
  { href: "/ratio-studies", label: "Ratios", icon: BarChart3 },
  { href: "/calibration", label: "Calibrate", icon: Sliders },
  { href: "/data-sources", label: "Sources", icon: Database },
  { href: "/snapshots", label: "Snapshots", icon: Camera },
  { href: "/audit", label: "Audit", icon: ScrollText },
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [pilotPanelOpen, setPilotPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [traceFeedOpen, setTraceFeedOpen] = useState(false);
  const [policyDebugOpen, setPolicyDebugOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingConfirmTool, setPendingConfirmTool] =
    useState<ToolDescriptor | null>(null);

  // Policy debug state
  const [userClaims, setUserClaims] = useState<string[]>([...ALL_CLAIMS]);
  const [enabledTools, setEnabledTools] = useState<string[]>(
    TOOL_REGISTRY.map((t) => t.toolId)
  );
  const [requireConfirmWriteHigh, setRequireConfirmWriteHigh] = useState(true);
  const [requireSupervisorIrreversible, setRequireSupervisorIrreversible] =
    useState(true);

  // Cmd+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNeedsConfirmation = useCallback((tool: ToolDescriptor) => {
    setPendingConfirmTool(tool);
  }, []);

  const currentPage =
    dockItems.find((item) => pathname === item.href)?.label || "Dashboard";

  return (
    <div className="space-bg min-h-screen relative">
      {/* ============================================
          TOP SYSTEM BAR
          "I always know where I am."
          ============================================ */}
      <header className="system-bar fixed top-0 left-0 right-0 flex items-center justify-between px-4">
        {/* Left: Brand + County Context */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground hidden sm:inline">
              TerraFusion
            </span>
          </Link>

          <div className="h-4 w-px bg-border/40 hidden sm:block" />

          {/* Context Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">
              {user?.county || "Benton County"}
            </span>
            <span className="hidden md:inline text-border/60">|</span>
            <span className="hidden md:inline">RY 2024</span>
            <span className="hidden lg:inline text-border/60">|</span>
            <span className="hidden lg:inline">
              {user?.role || "Assessor Admin"}
            </span>
          </div>
        </div>

        {/* Center: Current Page */}
        <div className="absolute left-1/2 -translate-x-1/2 text-xs font-medium text-foreground/80 tracking-wide">
          {currentPage}
        </div>

        {/* Right: Status + Search + Control Center Toggle */}
        <div className="flex items-center gap-2">
          {/* Sync Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-neon-green">
            <Radio className="w-3 h-3 neon-pulse" />
            <span className="hidden md:inline font-medium">Sync Live</span>
          </div>

          <div className="h-4 w-px bg-border/30 hidden sm:block" />

          {/* Cmd+K Search Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="hidden md:inline text-[10px] font-mono px-1 py-0.5 rounded bg-secondary/50 border border-border/40 text-muted-foreground">
              {"Cmd+K"}
            </kbd>
          </button>

          {/* Control Center Toggle */}
          <button
            onClick={() => setControlCenterOpen(!controlCenterOpen)}
            className="flex items-center gap-1 px-1.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
            title="Control Center"
          >
            {controlCenterOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed top-[var(--system-bar-h)] left-0 right-0 z-40 glass-panel border-b border-border/30 p-3 md:hidden">
          <nav className="grid grid-cols-4 gap-2">
            {dockItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] text-muted-foreground transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "hover:text-foreground hover:bg-secondary/30"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                setPilotPanelOpen(true);
              }}
              className="flex-1 gap-1.5 text-xs glass-btn border-primary/40 text-primary bg-transparent"
            >
              <Zap className="w-3.5 h-3.5" />
              Pilot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                setTraceFeedOpen(true);
              }}
              className="flex-1 gap-1.5 text-xs glass-btn border-violet-500/40 text-violet-400 bg-transparent"
            >
              <Shield className="w-3.5 h-3.5" />
              Trace
            </Button>
          </div>
        </div>
      )}

      {/* ============================================
          STAGE (Workspace)
          ============================================ */}
      <main className="stage">{children}</main>

      {/* ============================================
          DOCK LAUNCHER (Bottom)
          "I always know what to do next."
          ============================================ */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
        <TooltipProvider delayDuration={200}>
          <nav className="dock flex items-center gap-1 px-3">
            {dockItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn("dock-item", isActive && "active")}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={10}
                    className="glass-panel text-xs font-medium px-2.5 py-1"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Divider */}
            <div className="h-6 w-px bg-border/30 mx-1" />

            {/* Quick Actions in Dock */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPilotPanelOpen(true)}
                  className="dock-item"
                >
                  <Zap className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={10}
                className="glass-panel text-xs font-medium px-2.5 py-1"
              >
                TerraPilot
              </TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </div>

      {/* ============================================
          CONTROL CENTER (Right Edge Drawer)
          "I can always prove what I did."
          ============================================ */}
      <div
        className={cn(
          "fixed top-[var(--system-bar-h)] right-0 bottom-0 w-72 control-center z-30",
          "transform transition-transform duration-300 ease-out",
          controlCenterOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 h-full flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              Control Center
            </h2>
            <button
              onClick={() => setControlCenterOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Section */}
          <div className="glass-panel rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-foreground">
              {user?.name || "Demo Assessor"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {user?.county || "Benton County"} --{" "}
              {user?.role || "Assessor Admin"}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>

          {/* Suite Launchers */}
          <div className="space-y-2 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
              Suites
            </p>
            <button
              onClick={() => {
                setControlCenterOpen(false);
                setPilotPanelOpen(true);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">
                  TerraPilot
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Execute and explain
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setControlCenterOpen(false);
                setTraceFeedOpen(true);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors">
                <Shield className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">
                  TerraTrace
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Audit feed
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setControlCenterOpen(false);
                setPolicyDebugOpen(true);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors">
                <Settings2 className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">
                  Policy Debug
                </div>
                <div className="text-[10px] text-muted-foreground">
                  RBAC and risk gates
                </div>
              </div>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
              Quick Actions
            </p>
            <button
              onClick={() => {
                setControlCenterOpen(false);
                setAuditLogOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
            >
              <ScrollText className="w-3.5 h-3.5" />
              View Audit Log
            </button>
            <button
              onClick={() => {
                setControlCenterOpen(false);
                setSnapshotOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Create Snapshot
            </button>
          </div>

          {/* System Status */}
          <div className="mt-auto pt-4 border-t border-border/20">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              System
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sync</span>
                <span className="flex items-center gap-1 text-neon-green font-medium">
                  <Radio className="w-3 h-3 neon-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Roll Year</span>
                <span className="text-foreground font-medium">2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="text-foreground font-medium">Production</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  v0.9.0-alpha
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          OVERLAYS (Modals, Drawers, Palettes)
          ============================================ */}
      <AuditLogModal
        isOpen={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
      />
      <SnapshotModal
        isOpen={snapshotOpen}
        onClose={() => setSnapshotOpen(false)}
      />
      <TerraPilotPanel
        isOpen={pilotPanelOpen}
        onClose={() => setPilotPanelOpen(false)}
      />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenPanel={() => setPilotPanelOpen(true)}
        onNeedsConfirmation={handleNeedsConfirmation}
      />
      <TraceFeedDrawer
        isOpen={traceFeedOpen}
        onClose={() => setTraceFeedOpen(false)}
      />
      <PolicyDebugDrawer
        isOpen={policyDebugOpen}
        onClose={() => setPolicyDebugOpen(false)}
        userClaims={userClaims}
        setUserClaims={setUserClaims}
        enabledTools={enabledTools}
        setEnabledTools={setEnabledTools}
        mode="pilot"
        requireConfirmWriteHigh={requireConfirmWriteHigh}
        setRequireConfirmWriteHigh={setRequireConfirmWriteHigh}
        requireSupervisorIrreversible={requireSupervisorIrreversible}
        setRequireSupervisorIrreversible={setRequireSupervisorIrreversible}
      />
    </div>
  );
}
