import { describe, expect, it } from "vitest"
import { sumGoals } from "./goals.ts"

describe("sumGoals", () => {
  it("returns 0 when there are no goals", () => {
    expect(sumGoals([])).toBe(0)
  })

  it("adds up the goals", () => {
    expect(sumGoals([1, 2, 3])).toBe(6)
  })
})
