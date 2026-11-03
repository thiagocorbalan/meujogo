import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import Page from "./page"

test("home shows the app name and proves the workspace packages load", () => {
  render(<Page />)

  expect(screen.getByRole("heading", { level: 1, name: "Meu Jogo" })).toBeDefined()
  expect(screen.getByText("Contrato do /health: ok · 2 + 1 = 3 gols")).toBeDefined()
})
