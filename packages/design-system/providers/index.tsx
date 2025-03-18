import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { PrivyProvider } from "./privy";
import { ThemeProvider } from "./theme";
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
  </ThemeProvider>
);
