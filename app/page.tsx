"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hexagon } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to login after brief splash
    const timer = setTimeout(() => {
      router.push("/login");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="space-bg flex min-h-screen items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative">
            <Hexagon className="text-primary h-16 w-16" strokeWidth={1.5} />
            <Hexagon
              className="text-accent absolute top-0 left-0 h-16 w-16 opacity-50"
              strokeWidth={1}
              style={{ transform: "rotate(30deg)" }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">TerraFusion</h1>
        <p className="text-muted-foreground mb-8 text-lg">Sovereign Valuation Operating System</p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
          <div
            className="bg-primary h-2 w-2 animate-pulse rounded-full"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="bg-primary h-2 w-2 animate-pulse rounded-full"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
