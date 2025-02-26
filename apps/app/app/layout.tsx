import "@repo/design-system/styles/globals.css";
import { GlobalSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { DesignSystemProvider } from "@repo/design-system/providers";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import Intercom from "@/components/intercom";
import AlphaBanner from "@/components/header/alpha-banner";
import { Metadata } from "next";
import { MixpanelProvider } from "@/components/analytics/MixpanelProvider";
import { VersionInfo } from "@/components/footer/version-info";
import MobileSidebarTrigger from "@/components/header/sidebar-trigger";

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
    <body className="bg-sidebar">
      <MixpanelProvider>
        <DesignSystemProvider defaultTheme="dark">
          <SidebarProvider open={false}>
            <GlobalSidebar>
              <div>
                <div className="flex h-screen md:h-auto md:min-h-[calc(100vh-2rem)] flex-col px-2 md:px-6">
                  <AlphaBanner />
                  {children}
                </div>
                <footer className="fixed bottom-0 right-0 p-4">
                  {/* <VersionInfo /> */}
                </footer>
              </div>
            </GlobalSidebar>
          </SidebarProvider>
          {/* <Intercom /> */}
          {/* TODO: REENABLE WHEN SHIH-YU IS READY FOR IT <Intercom /> */}
        </DesignSystemProvider>
      </MixpanelProvider>
    </body>
  </html>
);

export default RootLayout;
