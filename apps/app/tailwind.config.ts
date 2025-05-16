import type { Config } from "tailwindcss";
import { config as baseConfig } from "@repo/tailwind-config/config";

const config: Config = {
  ...baseConfig,
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme?.extend,
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        shimmer: "shimmer 2s linear infinite",
        "shimmer-fast": "shimmer 1s linear infinite",
        "shimmer-slow": "shimmer 3s linear infinite",
      },
    },
  },
};

export default config;
