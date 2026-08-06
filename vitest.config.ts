import path from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // The real `server-only` package throws on import outside Next's
      // "react-server" build condition, which Vitest doesn't set. Swap in
      // its own no-op `empty.js` (the same file Next uses for RSC builds)
      // so server-only modules can still be unit tested directly.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**"],
  },
});
