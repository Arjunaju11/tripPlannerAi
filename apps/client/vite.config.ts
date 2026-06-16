import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

export default defineConfig({
  envDir: projectRoot,
  plugins: [react()],
  server: { port: 5173 }
});
