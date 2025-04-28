import "@repo/design-system/styles/globals.css";
import { DesignSystemProvider } from "@repo/design-system/providers";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import Intercom from "@/components/intercom";
import { Metadata } from "next";
import { MixpanelProvider } from "@/components/analytics/MixpanelProvider";
import { Inter, Playfair, Open_Sans } from "next/font/google";
import Script from "next/script";

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
  title: "Daydream", // This will be used for all pages
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" suppressHydrationWarning>
    <head></head>
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
      {process.env.NODE_ENV === "production" && (
        <>
          {/* Hotjar */}
          <Script
            id="contentsquare"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              (function (c, s, q, u, a, r, e) {
                  c.hj=c.hj||function(){(c.hj.q=c.hj.q||[]).push(arguments)};
                  c._hjSettings = { hjid: a };
                  r = s.getElementsByTagName('head')[0];
                  e = s.createElement('script'); e.async = true; e.src = q + c._hjSettings.hjid + u; r.appendChild(e);
              })(window, document, 'https://static.hj.contentsquare.net/c/csq-', '.js', 6381273);
            `,
            }}
          />
          {/* Google Analytics */}
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=G-F7BNWCLKW9`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-F7BNWCLKW9', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}
    </body>
  </html>
);

export default RootLayout;
