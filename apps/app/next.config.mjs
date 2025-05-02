import { withAxiom } from "next-axiom";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@livepeer/react", "@livepeer/core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "fabowvadozbihurwnvwd.supabase.co",
      },
    ],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "app.livepeer.org",
        "*.vercel.app",
      ],
    },
  },
  async headers() {
    return [
      {
        // Apply FFmpeg required headers ONLY to specific admin tool paths
        source: "/admin/tools/clip-preview-generator",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
      {
        // Apply FFmpeg required headers ONLY to specific admin tool paths
        source: "/admin/tools/clip-approval-queue",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
      // Add other global or path-specific headers here if needed
    ];
  },
};

export default withAxiom(nextConfig);
