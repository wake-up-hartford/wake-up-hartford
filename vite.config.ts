import { fileURLToPath, URL } from "node:url";

import netlify from "@netlify/vite-plugin-tanstack-start";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Standard TanStack Start setup, built for Netlify.
//
// Settings: Vite builds only VITE_* values into the browser code. Server code
// (server functions, src/server.ts) reads everything else, including secret
// keys, from process.env at run time, so secrets never reach the browser.
export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // src/server.ts wraps the server with the branded error page.
      server: { entry: "server" },
      // Stop browser code from importing server-only files.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    viteReact(),
    netlify({
      // In `vite dev`, don't imitate Netlify features the app doesn't use.
      // The Edge Functions one also crashes the dev server on Windows.
      dev: {
        edgeFunctions: { enabled: false },
        database: { enabled: false },
        blobs: { enabled: false },
        aiGateway: { enabled: false },
      },
    }),
  ],
  // Leaflet runs only in a browser, and the maps load lazily. Bundle the map
  // packages into the lazy map code, so the server never loads them at start-up.
  // (Netlify packs the server into one file and would otherwise load them
  // straight away, failing every page with "window is not defined".)
  ssr: { noExternal: ["leaflet", "react-leaflet", "@react-leaflet/core"] },
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: {
    host: "::",
    port: 8080,
  },
});
