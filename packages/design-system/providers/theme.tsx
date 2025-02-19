import { ThemeProvider as ThemeProviderRaw } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export const ThemeProvider = (properties: ThemeProviderProps) => (
  <ThemeProviderRaw
    attribute="class"
    defaultTheme="dark"
    enableSystem
    disableTransitionOnChange
    {...properties}
  />
);
