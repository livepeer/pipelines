import withBundleAnalyzer from "@next/bundle-analyzer";

// @ts-expect-error No declaration file
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { createSecureHeaders } from "next-secure-headers";

export const config: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: createSecureHeaders({
          // HSTS Preload: https://hstspreload.org/
          forceHTTPSRedirect: [
            true,
            { maxAge: 63_072_000, includeSubDomains: true, preload: true },
          ],
        }),
      },
    ];
  },

  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};
