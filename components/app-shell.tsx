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
import { TactileButton } from "@/components/material";
import {
  type ToolDescriptor,
  defaultRiskPolicy,
  DEFAULT_REASON_CODES,
  TOOL_REGISTRY,
  ALL_CLAIMS,
} from "@/lib/pilot/tools";
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
    <div className="space-bg flex min-h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="tf-glass tf-glass--strong border-border/50 sticky top-0 z-50 border-b">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="bg-primary/20 border-primary/40 flex h-10 w-10 items-center justify-center rounded-lg border">
                <Building2 className="text-primary h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-foreground text-lg font-semibold tracking-tight">
                  TerraFusion
                </h1>
                <p className="text-muted-foreground -mt-0.5 text-xs">Sovereign Valuation OS</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2",
                      isActive && "bg-secondary/50 text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* TerraPilot Button */}
            <TactileButton
              variant="outline"
              size="sm"
              onClick={() => setPilotPanelOpen(true)}
              className="border-primary/50 text-primary hover:bg-primary/10 hidden gap-2 bg-transparent sm:flex"
            >
              <Zap className="h-4 w-4" />
              TerraPilot
            </TactileButton>

            {/* Trace Feed Button */}
            <TactileButton
              variant="outline"
              size="sm"
              onClick={() => setTraceFeedOpen(true)}
              className="hidden gap-2 border-violet-500/50 bg-transparent text-violet-400 hover:bg-violet-500/10 sm:flex"
            >
              <Shield className="h-4 w-4" />
              Trace
            </TactileButton>

            {/* Policy Debug Button */}
            <TactileButton
              variant="outline"
              size="sm"
              onClick={() => setPolicyDebugOpen(true)}
              className="hidden gap-2 border-amber-500/50 bg-transparent text-amber-400 hover:bg-amber-500/10 lg:flex"
              title="Debug policy gates"
            >
              <Settings2 className="h-4 w-4" />
              Policy
            </TactileButton>

            {/* Audit Log Button */}
            <TactileButton
              variant="outline"
              size="sm"
              onClick={() => setAuditLogOpen(true)}
              className="border-border/50 text-foreground hidden gap-2 bg-transparent lg:flex"
            >
              <FileText className="h-4 w-4" />
              Audit Log
            </TactileButton>

            {/* Roll Year Snapshot Button */}
            <TactileButton
              variant="outline"
              size="sm"
              onClick={() => setSnapshotOpen(true)}
              className="border-border/50 text-foreground hidden gap-2 bg-transparent lg:flex"
            >
              <Camera className="h-4 w-4" />
              Snapshot
            </TactileButton>

            {/* User Info */}
            {user && (
              <div className="border-border/50 ml-2 hidden items-center gap-3 border-l pl-4 xl:flex">
                <div className="text-right">
                  <p className="text-foreground text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {user.county} · {user.role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/login")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Log out</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-border/50 space-y-2 border-t p-4 md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-muted-foreground w-full justify-start gap-3",
                      isActive && "bg-secondary/50 text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="border-border/50 space-y-2 border-t pt-2">
              <TactileButton
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPilotPanelOpen(true);
                }}
                className="border-primary/50 text-primary w-full justify-start gap-3 bg-transparent"
              >
                <Zap className="h-4 w-4" />
                TerraPilot
              </TactileButton>
              <TactileButton
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTraceFeedOpen(true);
                }}
                className="w-full justify-start gap-3 border-violet-500/50 bg-transparent text-violet-400"
              >
                <Shield className="h-4 w-4" />
                Trace Feed
              </TactileButton>
              <TactileButton
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuditLogOpen(true);
                }}
                className="border-border/50 text-foreground w-full justify-start gap-3 bg-transparent"
              >
                <FileText className="h-4 w-4" />
                Audit Log
              </TactileButton>
              <TactileButton
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSnapshotOpen(true);
                }}
                className="border-border/50 text-foreground w-full justify-start gap-3 bg-transparent"
              >
                <Camera className="h-4 w-4" />
                Roll Year Snapshot
              </TactileButton>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Modals */}
      <AuditLogModal isOpen={auditLogOpen} onClose={() => setAuditLogOpen(false)} />
      <SnapshotModal isOpen={snapshotOpen} onClose={() => setSnapshotOpen(false)} />

      {/* TerraPilot Panel */}
      <TerraPilotPanel isOpen={pilotPanelOpen} onClose={() => setPilotPanelOpen(false)} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenPanel={() => setPilotPanelOpen(true)}
        onNeedsConfirmation={handleNeedsConfirmation}
      />

      {/* Trace Feed Drawer */}
      <TraceFeedDrawer isOpen={traceFeedOpen} onClose={() => setTraceFeedOpen(false)} />
    </div>
  );
}
