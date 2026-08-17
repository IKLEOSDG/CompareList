import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "public",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "static-next",
    emptyOutDir: true,
    lib: {
      entry: "standalone-entry.tsx",
      name: "YJRenovationPortal",
      formats: ["iife"],
      fileName: () => "app.js",
      cssFileName: "app",
    },
  },
});
