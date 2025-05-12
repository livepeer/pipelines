import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import type { UserConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
} as UserConfig);
