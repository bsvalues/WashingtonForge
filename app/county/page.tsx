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
import {
  getCounties,
  selectCounty,
  type County,
  type UserRole,
} from "@/lib/api";
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
    <div className="min-h-screen space-bg flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Select Your Workspace
          </h1>
          <p className="text-muted-foreground">
            Choose your county and role to continue
          </p>
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* County Selection */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">
                Select County
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search counties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* County List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCounties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No counties found
                </p>
              ) : (
                filteredCounties.map((county) => (
                  <button
                    key={county.id}
                    type="button"
                    onClick={() => setSelectedCounty(county.id)}
                    className={cn(
                      "w-full p-4 rounded-lg text-left transition-all",
                      "glass-btn border border-transparent",
                      selectedCounty === county.id
                        ? "border-primary/50 bg-primary/10"
                        : "hover:border-border/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {county.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {county.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
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
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">
                Select Role
              </h2>
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
                      "w-full p-4 rounded-lg text-left transition-all",
                      "glass-btn border border-transparent",
                      selectedRole === role.value
                        ? "border-primary/50 bg-primary/10"
                        : "hover:border-border/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          selectedRole === role.value
                            ? "bg-primary/20"
                            : "bg-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            selectedRole === role.value
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {role.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
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
            className="glass-btn-primary text-foreground font-medium px-8 h-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up workspace...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
