import globals from "globals"
import { defineConfig } from "eslint/config"
import base, { tsFiles } from "./base.js"

export default defineConfig([
  base,
  {
    files: tsFiles,
    languageOptions: { globals: globals.node },
  },
])
