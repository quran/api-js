import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["./test/**/*.test.{js,ts,jsx,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
