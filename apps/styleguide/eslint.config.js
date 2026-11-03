import react from "@meujogo/eslint-config/react"
import reactRefresh from "eslint-plugin-react-refresh"
import { defineConfig } from "eslint/config"

export default defineConfig([
  react,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [reactRefresh.configs.vite],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])
