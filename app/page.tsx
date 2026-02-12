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
    <div className="min-h-screen space-bg flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <Hexagon className="w-16 h-16 text-primary" strokeWidth={1.5} />
            <Hexagon
              className="w-16 h-16 text-accent absolute top-0 left-0 opacity-50"
              strokeWidth={1}
              style={{ transform: "rotate(30deg)" }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
          TerraFusion
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Sovereign Valuation Operating System
        </p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
