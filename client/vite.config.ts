import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      crypto: 'crypto-browserify',
    },
  },
  plugins: [
    react(),
  ],
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
