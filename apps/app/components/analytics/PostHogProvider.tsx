"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { usePostHog } from "posthog-js/react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }

      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

// Wrap PostHogPageView in Suspense to avoid the useSearchParams usage above
// from de-opting the whole app into client-side rendering
function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if PostHog key is available
    console.log("Environment check - process.env:", {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
      // Log all NEXT_PUBLIC_ env vars without showing actual values
      envKeys: Object.keys(process.env).filter(key =>
        key.startsWith("NEXT_PUBLIC_"),
      ),
    });

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    console.log("PostHog key check:", {
      keyExists: !!posthogKey,
      keyType: typeof posthogKey,
      keyLength: posthogKey ? posthogKey.length : 0,
      // Show first and last two characters if exists
      keySample: posthogKey
        ? `${posthogKey.slice(0, 2)}...${posthogKey.slice(-2)}`
        : "none",
    });

    if (!posthogKey) {
      console.warn(
        "NEXT_PUBLIC_POSTHOG_KEY is not set - analytics will not be initialized",
      );
      return;
    }

    try {
      posthog.init(posthogKey, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true, // Disable automatic pageview capture, as we capture manually
      });
      console.log("PostHog successfully initialized");
    } catch (error) {
      console.error("Error initializing PostHog:", error);
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}
