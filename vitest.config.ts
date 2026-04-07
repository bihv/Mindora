import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
    css: true,
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
  },
});
