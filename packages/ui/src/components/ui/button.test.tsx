import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "./button.tsx"

describe("Button", () => {
  it("renders an accessible button with its label", () => {
    render(<Button>Confirmar presença</Button>)

    expect(
      screen.getByRole("button", { name: "Confirmar presença" })
    ).toBeInstanceOf(HTMLButtonElement)
  })
})
