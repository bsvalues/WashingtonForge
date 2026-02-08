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
  FileText,
  Camera,
  Menu,
  X,
  LayoutDashboard,
  Sliders,
  ScrollText,
  Database,
  Zap,
  Shield,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditLogModal } from "@/components/audit-log-modal";
import { SnapshotModal } from "@/components/snapshot-modal";
import { TerraPilotPanel } from "@/components/pilot/terra-pilot-panel";
import { CommandPalette } from "@/components/pilot/command-palette";
import { TraceFeedDrawer } from "@/components/trace/trace-feed-drawer";
import { PolicyDebugDrawer } from "@/components/pilot/policy-debug-drawer";
import { type ToolDescriptor, defaultRiskPolicy, DEFAULT_REASON_CODES, TOOL_REGISTRY, ALL_CLAIMS } from "@/lib/pilot/tools";
import { executeTool, getDemoPilotContext, generateCorrelationId } from "@/lib/pilot/executor";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: string;
    county: string;
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cockpit", label: "Cockpit", icon: Map },
  { href: "/ingest", label: "Ingest", icon: Upload },
  { href: "/ratio-studies", label: "Ratio Studies", icon: BarChart3 },
  { href: "/calibration", label: "Calibration", icon: Sliders },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/snapshots", label: "Snapshots", icon: Camera },
  { href: "/audit", label: "Audit", icon: ScrollText },
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [pilotPanelOpen, setPilotPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [traceFeedOpen, setTraceFeedOpen] = useState(false);
  const [policyDebugOpen, setPolicyDebugOpen] = useState(false);
  const [pendingConfirmTool, setPendingConfirmTool] = useState<ToolDescriptor | null>(null);

  // Policy debug state (live toggles)
  const [userClaims, setUserClaims] = useState<string[]>([...ALL_CLAIMS]);
  const [enabledTools, setEnabledTools] = useState<string[]>(TOOL_REGISTRY.map((t) => t.toolId));
  const [requireConfirmWriteHigh, setRequireConfirmWriteHigh] = useState(true);
  const [requireSupervisorIrreversible, setRequireSupervisorIrreversible] = useState(true);

  // Global keyboard shortcut for command palette
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

  return (
    <div className="space-bg min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="glass-panel sticky top-0 z-50 border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  TerraFusion
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  Sovereign Valuation OS
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                      isActive && "bg-secondary/50 text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* TerraPilot Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPilotPanelOpen(true)}
              className="hidden sm:flex gap-2 glass-btn border-primary/50 text-primary hover:bg-primary/10 bg-transparent"
            >
              <Zap className="w-4 h-4" />
              TerraPilot
            </Button>

            {/* Trace Feed Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTraceFeedOpen(true)}
              className="hidden sm:flex gap-2 glass-btn border-violet-500/50 text-violet-400 hover:bg-violet-500/10 bg-transparent"
            >
              <Shield className="w-4 h-4" />
              Trace
            </Button>

            {/* Policy Debug Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPolicyDebugOpen(true)}
              className="hidden lg:flex gap-2 glass-btn border-amber-500/50 text-amber-400 hover:bg-amber-500/10 bg-transparent"
              title="Debug policy gates"
            >
              <Settings2 className="w-4 h-4" />
              Policy
            </Button>

            {/* Audit Log Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuditLogOpen(true)}
              className="hidden lg:flex gap-2 glass-btn border-border/50 text-foreground bg-transparent"
            >
              <FileText className="w-4 h-4" />
              Audit Log
            </Button>

            {/* Roll Year Snapshot Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSnapshotOpen(true)}
              className="hidden lg:flex gap-2 glass-btn border-border/50 text-foreground bg-transparent"
            >
              <Camera className="w-4 h-4" />
              Snapshot
            </Button>

            {/* User Info */}
            {user && (
              <div className="hidden xl:flex items-center gap-3 ml-2 pl-4 border-l border-border/50">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.county} · {user.role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/login")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only">Log out</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/50 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 text-muted-foreground",
                      isActive && "bg-secondary/50 text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border/50 space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPilotPanelOpen(true);
                }}
                className="w-full justify-start gap-3 glass-btn border-primary/50 text-primary bg-transparent"
              >
                <Zap className="w-4 h-4" />
                TerraPilot
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTraceFeedOpen(true);
                }}
                className="w-full justify-start gap-3 glass-btn border-violet-500/50 text-violet-400 bg-transparent"
              >
                <Shield className="w-4 h-4" />
                Trace Feed
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuditLogOpen(true);
                }}
                className="w-full justify-start gap-3 glass-btn border-border/50 text-foreground bg-transparent"
              >
                <FileText className="w-4 h-4" />
                Audit Log
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSnapshotOpen(true);
                }}
                className="w-full justify-start gap-3 glass-btn border-border/50 text-foreground bg-transparent"
              >
                <Camera className="w-4 h-4" />
                Roll Year Snapshot
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Modals */}
      <AuditLogModal
        isOpen={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
      />
      <SnapshotModal
        isOpen={snapshotOpen}
        onClose={() => setSnapshotOpen(false)}
      />

      {/* TerraPilot Panel */}
      <TerraPilotPanel
        isOpen={pilotPanelOpen}
        onClose={() => setPilotPanelOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenPanel={() => setPilotPanelOpen(true)}
        onNeedsConfirmation={handleNeedsConfirmation}
      />

      {/* Trace Feed Drawer */}
      <TraceFeedDrawer
        isOpen={traceFeedOpen}
        onClose={() => setTraceFeedOpen(false)}
      />

      {/* Policy Debug Drawer */}
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
