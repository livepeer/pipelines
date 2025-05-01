import "@repo/design-system/styles/globals.css";
import { DesignSystemProvider } from "@repo/design-system/providers";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import Intercom from "@/components/intercom";
import { Metadata } from "next";
import { MixpanelProvider } from "@/components/analytics/MixpanelProvider";
import { Inter, Playfair, Open_Sans } from "next/font/google";
import { ThirdPartyAnalytics } from "@/scripts/analytics";

const playfair = Playfair({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

type RootLayoutProperties = {
  readonly children: ReactNode;
};

export const metadata: Metadata = {
  title: {
    template: "%s | Daydream",
    default: "Daydream - Create AI Videos with Prompts",
  },
  description:
    "Create beautiful AI videos with prompts. Turn your ideas into stunning visual content in seconds.",
  generator: "Next.js",
  applicationName: "Daydream",
  referrer: "origin-when-cross-origin",
  keywords: [
    "AI video",
    "AI generation",
    "prompt-to-video",
    "content creation",
    "Daydream",
  ],
  authors: [{ name: "Daydream Labs" }],
  creator: "Daydream Labs",
  publisher: "Daydream Labs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : new URL(
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000",
      ),
  openGraph: {
    title: "Daydream - Create AI Videos with Prompts",
    description:
      "Create beautiful AI videos with prompts. Turn your ideas into stunning visual content in seconds.",
    url: "https://daydream.live",
    siteName: "Daydream",
    images: [],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daydream - Create AI Videos with Prompts",
    description:
      "Create beautiful AI videos with prompts. Turn your ideas into stunning visual content in seconds.",
    creator: "@daydreamlabs",
    images: [],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  verification: {
    google: "google-site-verification-code", // Replace with real verification code if available
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" suppressHydrationWarning>
    <body
      className={`${inter.variable} ${playfair.variable} ${openSans.variable} bg-sidebar font-sans`}
    >
      <MixpanelProvider>
        <DesignSystemProvider defaultTheme="light" enableSystem={false}>
          {children}
          <Intercom />
          {/* TODO: REENABLE WHEN SHIH-YU IS READY FOR IT <Intercom /> */}
        </DesignSystemProvider>
      </MixpanelProvider>
      <ThirdPartyAnalytics />
    </body>
  </html>
);

export default RootLayout;
