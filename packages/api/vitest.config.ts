import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["./test/**/*.test.{js,ts,jsx,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
