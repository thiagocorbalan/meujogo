import type { Metadata } from "next"
import type { ReactNode } from "react"
import { lexend, manrope, rajdhani } from "./fonts"
import { ThemeProvider } from "./theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Meu Jogo",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // next-themes writes the theme class on <html> before hydration.
    <html
      lang="pt-BR"
      className={`${lexend.variable} ${manrope.variable} ${rajdhani.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
