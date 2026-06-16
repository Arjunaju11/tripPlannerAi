import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/services/auth.service.ts", "src/services/itinerary.service.ts", "src/services/token.service.ts", "src/utils/*.ts"],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80
      }
    }
  }
});
