import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const ui = resolve(import.meta.dirname, "../../packages/ui/src")

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@meujogo/ui/globals.css", replacement: `${ui}/styles/globals.css` },
      { find: /^@meujogo\/ui\/(.*)$/, replacement: `${ui}/$1` },
      { find: /^@\/(.*)$/, replacement: `${resolve(import.meta.dirname, "src")}/$1` },
    ],
  },
})
