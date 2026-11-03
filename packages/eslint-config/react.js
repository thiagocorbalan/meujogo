import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import { defineConfig } from "eslint/config"
import base, { tsFiles } from "./base.js"

export default defineConfig([
  base,
  {
    files: tsFiles,
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
])
