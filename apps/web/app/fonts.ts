import { Lexend, Manrope, Rajdhani } from "next/font/google"

export const lexend = Lexend({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-lexend",
})

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
})

export const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-rajdhani",
})
