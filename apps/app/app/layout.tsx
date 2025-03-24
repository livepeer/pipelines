import "@repo/design-system/styles/globals.css";
import { DesignSystemProvider } from "@repo/design-system/providers";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import Intercom from "@/components/intercom";
import { Metadata } from "next";
import { MixpanelProvider } from "@/components/analytics/MixpanelProvider";
import { Inter, Playfair, Open_Sans } from "next/font/google";

const playfair = Playfair({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700"],
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
  title: "Livepeer Pipelines", // This will be used for all pages
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
    </body>
  </html>
);

export default RootLayout;
