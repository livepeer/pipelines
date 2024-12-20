import "@repo/design-system/styles/globals.css";
import { GlobalSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { DesignSystemProvider } from "@repo/design-system/providers";
import type { ReactNode } from "react";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import Header from "@/components/header/index";
import { Separator } from "@repo/design-system/components/ui/separator";
import Intercom from "@/components/intercom";
import { AlarmCheck } from "lucide-react";
import AlphaBanner from "@/components/header/alpha-banner";
import { Metadata } from "next";
import SessionTracker from "@/components/analytics/SessionTracker";
import { MixpanelProvider } from "@/components/analytics/MixpanelProvider";
type RootLayoutProperties = {
  readonly children: ReactNode;
};

export const metadata: Metadata = {
  title: "Livepeer Pipelines"  // This will be used for all pages
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-sidebar pt-10">
      <DesignSystemProvider defaultTheme="dark">
        <MixpanelProvider>
          <SessionTracker />
          <AlphaBanner />
          <SidebarProvider>
            <GlobalSidebar>
              <div>
                <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex w-screen items-center gap-2 border-border border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Header />
                </div>
              </header>
              <div className="flex h-[calc(100vh-5rem)] flex-col overflow-y-auto px-6 py-4">
                {children}
              </div>
            </div>
          </GlobalSidebar>
        </SidebarProvider>
        <Intercom />
        </MixpanelProvider>
      </DesignSystemProvider>
    </body>
  </html>
);

export default RootLayout;
