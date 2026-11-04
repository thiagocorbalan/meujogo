import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { ThemeProvider } from "next-themes"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { ThemeSwitcher } from "./theme-switcher.tsx"

function renderWithTheme(defaultTheme = "system") {
  return render(
    <ThemeProvider attribute="class" value={{ light: "theme-light", dark: "dark" }} defaultTheme={defaultTheme} enableSystem>
      <ThemeSwitcher />
    </ThemeProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
})

afterEach(cleanup)

describe("ThemeSwitcher", () => {
  it("groups the light, automatic and dark options under the accessible name Tema", () => {
    renderWithTheme()

    const themes = screen.getByRole("group", { name: "Tema" })
    expect(themes).toBeDefined()
    expect(screen.getByRole("button", { name: "Claro" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Automático" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Escuro" })).toBeDefined()
  })

  it("marks the stored theme as pressed once mounted", () => {
    renderWithTheme("dark")

    expect(screen.getByRole("button", { name: "Escuro" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "Claro" }).getAttribute("aria-pressed")).toBe("false")
  })

  it("applies the dark class to the document when Escuro is chosen", () => {
    renderWithTheme("light")

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Escuro" }))
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(screen.getByRole("button", { name: "Escuro" }).getAttribute("aria-pressed")).toBe("true")
  })

  it("renders no option as pressed on the server, where the stored theme is unknown", () => {
    const html = renderToString(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <ThemeSwitcher />
      </ThemeProvider>
    )

    expect(html).not.toContain('aria-pressed="true"')
  })
})
