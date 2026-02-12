"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push("/county");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
      console.error("[v0] Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-bg min-h-screen flex items-center justify-center p-6">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="glass-panel rounded-2xl p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              TerraFusion
            </h1>
            <p className="text-muted-foreground text-sm">
              Sovereign Valuation Operating System
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="assessor@county.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full glass-btn-primary text-foreground font-medium h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Mode */}
          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center mb-3">
              No account? Try the demo:
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/county")}
              className="w-full glass-btn text-foreground border-accent/40 hover:border-accent/60"
            >
              Enter Demo Mode
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Footer Links */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          Protected by FISMA-High compliant security protocols.
          <br />
          All access is logged and monitored.
        </p>
      </div>
    </div>
  );
}
