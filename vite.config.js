import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodePolyfills from "rollup-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["buffer", "process"],
  },
  define: {
    global: "globalThis",   // 👈 fixes the "global is not defined"
    "process.env": {}, // 👈 prevents process.env crash
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
  },
  resolve: {
    alias: {
      events: "events/",   // 👈 use the browser version
      util: "util/",    // 👈 polyfill util
      process: "process/browser",
      buffer: "buffer/",
    },
  },
})
