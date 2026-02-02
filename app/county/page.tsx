"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Users,
  Shield,
  Eye,
  BarChart,
  ArrowRight,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCounties, selectCounty, type County, type UserRole } from "@/lib/api";
import { ApiError } from "@/components/api-error";
import { cn } from "@/lib/utils";

const roles: { value: UserRole; label: string; icon: typeof Shield; description: string }[] = [
  {
    value: "admin",
    label: "Administrator",
    icon: Shield,
    description: "Full system access and configuration",
  },
  {
    value: "assessor",
    label: "Assessor",
    icon: Building2,
    description: "Valuation and assessment management",
  },
  {
    value: "analyst",
    label: "Analyst",
    icon: BarChart,
    description: "Data analysis and reporting",
  },
  {
    value: "viewer",
    label: "Viewer",
    icon: Eye,
    description: "Read-only access to data",
  },
];

export default function CountyPage() {
  const router = useRouter();
  const [counties, setCounties] = useState<County[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCounties() {
      try {
        const data = await getCounties();
        setCounties(data);
      } catch (err) {
        console.error("[v0] Failed to load counties:", err);
        setError(err instanceof Error ? err.message : "Failed to load counties. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadCounties();
  }, []);

  const filteredCounties = counties.filter(
    (county) =>
      county.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      county.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = async () => {
    if (!selectedCounty || !selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await selectCounty(selectedCounty, selectedRole);
      router.push("/dashboard");
    } catch (err) {
      console.error("[v0] Failed to select county:", err);
      setError("Failed to select county. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-bg min-h-screen p-4 md:p-8">
      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute top-1/3 left-1/4 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-accent/5 absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="bg-primary/20 border-primary/40 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border">
            <Building2 className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-semibold">Select Your Workspace</h1>
          <p className="text-muted-foreground">Choose your county and role to continue</p>
        </div>

        {error && (
          <div className="mb-6">
            <ApiError
              error={error}
              onRetry={() => {
                setError(null);
                setIsLoading(true);
                getCounties()
                  .then(setCounties)
                  .catch((err) => setError(err.message || "Failed to load counties"))
                  .finally(() => setIsLoading(false));
              }}
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* County Selection */}
          <div className="tf-glass rounded-xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <MapPin className="text-primary h-5 w-5" />
              <h2 className="text-foreground text-lg font-medium">Select County</h2>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search counties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-input border-border/50 text-foreground placeholder:text-muted-foreground pl-10"
              />
            </div>

            {/* County List */}
            <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : filteredCounties.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No counties found</p>
              ) : (
                filteredCounties.map((county) => (
                  <button
                    key={county.id}
                    type="button"
                    onClick={() => setSelectedCounty(county.id)}
                    className={cn(
                      "w-full rounded-lg p-4 text-left transition-all",
                      "tf-glass-btn border border-transparent",
                      selectedCounty === county.id
                        ? "border-primary/50 bg-primary/10"
                        : "hover:border-border/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">{county.name}</p>
                        <p className="text-muted-foreground text-sm">{county.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-sm">
                          {county.parcelCount.toLocaleString()} parcels
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="tf-glass rounded-xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <Users className="text-primary h-5 w-5" />
              <h2 className="text-foreground text-lg font-medium">Select Role</h2>
            </div>

            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={cn(
                      "w-full rounded-lg p-4 text-left transition-all",
                      "tf-glass-btn border border-transparent",
                      selectedRole === role.value
                        ? "border-primary/50 bg-primary/10"
                        : "hover:border-border/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          selectedRole === role.value ? "bg-primary/20" : "bg-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            selectedRole === role.value ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{role.label}</p>
                        <p className="text-muted-foreground text-sm">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedCounty || !selectedRole || isSubmitting}
            className="tf-glass-btn tf-glass-btn--primary text-foreground h-12 px-8 font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up workspace...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
