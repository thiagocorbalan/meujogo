import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import Page from "./page"

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  })
)

vi.mock("next/navigation", () => ({ notFound }))

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  notFound.mockClear()
})

test("design system page renders a button, the root header and the bottom nav", () => {
  vi.stubEnv("NODE_ENV", "development")

  render(<Page />)

  expect(screen.getByRole("button", { name: "Confirmar presença" })).toBeDefined()
  expect(screen.getByRole("button", { name: "Trocar de grupo, Racha do Bolinha" })).toBeDefined()
  expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeDefined()
  expect(screen.getByRole("button", { name: "Início" }).getAttribute("aria-current")).toBe("page")
  expect(notFound).not.toHaveBeenCalled()
})

test("design system page offers light, automatic and dark themes", () => {
  vi.stubEnv("NODE_ENV", "development")

  render(<Page />)

  const themes = screen.getByRole("group", { name: "Tema" })
  expect(themes.textContent).toContain("Claro")
  expect(themes.textContent).toContain("Automático")
  expect(themes.textContent).toContain("Escuro")
})

test("design system page is not found in production", () => {
  vi.stubEnv("NODE_ENV", "production")

  expect(() => Page()).toThrow("NEXT_NOT_FOUND")
  expect(notFound).toHaveBeenCalledOnce()
})
