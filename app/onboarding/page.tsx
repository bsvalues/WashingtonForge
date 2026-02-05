"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * HARD REDIRECT: /onboarding → /data-suite?tab=onboarding
 * 
 * The Data Suite is the SINGLE AUTHORITY for all data operations.
 * This route exists only for backwards compatibility and immediately redirects.
 * No legacy components mount here - fail-closed architecture.
 */
export default function OnboardingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Hard redirect - no UI, no state, no legacy code paths
    router.replace("/data-suite?tab=onboarding");
  }, [router]);

  // Minimal loading state during redirect
  return (
    <div className="space-bg flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground text-sm">Redirecting to Data Suite...</p>
      </div>
    </div>
  );
}
