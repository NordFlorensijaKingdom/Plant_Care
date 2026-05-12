import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["artifacts/**/*.test.ts", "artifacts/**/*.test.tsx"],
    environment: "node",
    globals: true,
  },
});

