/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";

const isCloudflareProductionBuild = process.env.CF_PAGES_BRANCH === "main";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: isCloudflareProductionBuild,
  },
  plugins: [react(), svgr(), tsConfigPaths()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
  },
});
