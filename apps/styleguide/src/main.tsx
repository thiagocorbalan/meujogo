import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"
import "@meujogo/ui/globals.css"
import { TooltipProvider } from "@meujogo/ui/components/ui/tooltip"
import { Toaster } from "@meujogo/ui/components/ui/sonner"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Not `light`: that class is reserved for forced-light subtrees (see `@custom-variant dark`). */}
    <ThemeProvider attribute="class" value={{ light: "theme-light", dark: "dark" }} enableSystem>
      <TooltipProvider>
        <App />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
