import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
      "react-i18next": path.resolve(
        __dirname,
        "src/shared/lib/i18n-shim/react-i18next.ts",
      ),
    },
  },
  clearScreen: false,
  server: {
    port: parseInt(process.env.VITE_PORT || "1521", 10),
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: parseInt(process.env.VITE_PORT || "1521", 10) + 1,
        }
      : undefined,
    fs: {
      // Workaround for Vite/Vitest /@fs/ path issues on non-C: Windows drives.
      allow: ["."],
    },
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
