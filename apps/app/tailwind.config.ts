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
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px 2px rgba(59, 130, 246, 0.3)" },
          "50%": { boxShadow: "0 0 15px 5px rgba(59, 130, 246, 0.6)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        shimmer: "shimmer 2s linear infinite",
        "shimmer-fast": "shimmer 1s linear infinite",
        "shimmer-slow": "shimmer 3s linear infinite",
        "glow-pulse": "glow 1.2s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out 2",
        "attention-pulse": "pulse 1s ease-in-out 2",
      },
    },
  },
};

export default config;
