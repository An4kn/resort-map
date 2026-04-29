import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "client",
  publicDir: false,
  build: {
    outDir: resolve(__dirname, "public"),
    emptyOutDir: true,
    assetsDir: "static",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/assets": "http://localhost:8080",
    },
  },
});
