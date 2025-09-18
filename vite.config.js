import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodePolyfills from "rollup-plugin-node-polyfills";
import daisyui from 'daisyui'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      plugins: [daisyui],
      config: {
        theme: {
          extend: {
            keyframes: {
              bounceCustom: {
                "0%, 100%": { transform: "translateY(0)" },
                "25%": { transform: "translateY(-5px)" },
                "50%": { transform: "translateY(5px)" },
                "75%": { transform: "translateY(-3px)" },
              },
              pingCustom: {
                "0%": { transform: "scale(1)", opacity: "0.8" },
                "100%": { transform: "scale(1.8)", opacity: "0" },
              },
            },
            animation: {
              "bounce-custom": "bounceCustom 0.8s infinite",
              "ping-custom": "pingCustom 1.2s infinite",
            },
          },
        },
      },
    }),
  ],
  optimizeDeps: {
    include: ["buffer", "process"],
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
  },
  resolve: {
    alias: {
      events: "events/",
      util: "util/",
      process: "process/browser",
      buffer: "buffer/",
    },
  },
})
