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
        pulse: {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.01)" },
          "50%": { transform: "scale(1.02)" },
          "75%": { transform: "scale(1.01)" },
          "100%": { transform: "scale(1)" },
        },
        pulseAndGlow: {
          "0%": {
            transform: "scale(1)",
            boxShadow: "0 0 2px 1px rgba(59, 130, 246, 0.2)",
          },
          "50%": {
            transform: "scale(1.02)",
            boxShadow: "0 0 5px 2px rgba(59, 130, 246, 0.3)",
          },
          "100%": {
            transform: "scale(1)",
            boxShadow: "0 0 2px 1px rgba(59, 130, 246, 0.2)",
          },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        shimmer: "shimmer 2s linear infinite",
        "shimmer-fast": "shimmer 1s linear infinite",
        "shimmer-slow": "shimmer 3s linear infinite",
        "attention-pulse": "pulse 3s ease-in-out infinite",
        "highlight-effect": "pulseAndGlow 3s ease-in-out infinite",
      },
    },
  },
};

export default config;
