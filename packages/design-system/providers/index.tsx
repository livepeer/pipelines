import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { PrivyProvider } from "./privy";
import { ThemeProvider } from "./theme";
// @ts-ignore
import { VercelToolbar } from "@vercel/toolbar/next";
type DesignSystemProviderProperties = ThemeProviderProps;

export const DesignSystemProvider = ({
  children,
  ...properties
}: DesignSystemProviderProperties) => (
  <ThemeProvider {...properties}>
    <PrivyProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </PrivyProvider>
    <Toaster />
    {process.env.NODE_ENV !== "production" && <VercelToolbar />}
  </ThemeProvider>
);
