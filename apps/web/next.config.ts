import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@meujogo/ui"],
  turbopack: {
    rules: {
      // @meujogo/ui inlines the brand SVGs with Vite's `?raw`, which Turbopack does not handle on its own.
      "*.svg": { condition: { query: "?raw" }, type: "text" },
    },
  },
}

export default nextConfig
