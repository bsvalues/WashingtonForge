"use client";

import React from "react";

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
    <div className="space-bg flex min-h-screen items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-accent/5 absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="tf-glass rounded-2xl p-8">
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <div className="bg-primary/20 border-primary/40 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border">
              <Building2 className="text-primary h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-semibold">TerraFusion</h1>
            <p className="text-muted-foreground text-sm">Sovereign Valuation Operating System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="assessor@county.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="tf-glass-btn tf-glass-btn--primary text-foreground h-11 w-full font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Mode */}
          <div className="border-border/30 mt-6 border-t pt-6">
            <p className="text-muted-foreground mb-3 text-center text-xs">
              No account? Try the demo:
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/county")}
              className="tf-glass-btn text-foreground border-accent/40 hover:border-accent/60 w-full"
            >
              Enter Demo Mode
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Footer Links */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Security Note */}
        <p className="text-muted-foreground mt-6 px-4 text-center text-xs">
          Protected by FISMA-High compliant security protocols.
          <br />
          All access is logged and monitored.
        </p>
      </div>
    </div>
  );
}
