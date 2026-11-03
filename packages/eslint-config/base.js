import js from "@eslint/js"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export const tsFiles = ["**/*.{ts,tsx}"]

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: tsFiles,
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
])
