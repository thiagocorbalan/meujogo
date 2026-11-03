import react from "@meujogo/eslint-config/react"
import nextPlugin from "@next/eslint-plugin-next"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores([".next", "next-env.d.ts"]),
  react,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [nextPlugin.configs["core-web-vitals"]],
  },
])
