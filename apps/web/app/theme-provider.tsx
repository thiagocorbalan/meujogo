"use client"

import type { ReactNode } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Not `light`: that class is reserved for forced-light subtrees (see `@custom-variant dark`).
  return (
    <NextThemesProvider attribute="class" value={{ light: "theme-light", dark: "dark" }} enableSystem>
      {children}
    </NextThemesProvider>
  )
}
