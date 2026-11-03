import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"
import "@meujogo/ui/globals.css"
import { TooltipProvider } from "@meujogo/ui/components/ui/tooltip"
import { Toaster } from "@meujogo/ui/components/ui/sonner"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" value={{ light: "claro", dark: "dark" }} enableSystem>
      <TooltipProvider>
        <App />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
