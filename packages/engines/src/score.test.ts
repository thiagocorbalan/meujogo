import { describe, expect, it } from "vitest"
import { sumScore } from "./score.ts"

describe("sumScore", () => {
  it("returns 0 when there are no goals", () => {
    expect(sumScore([])).toBe(0)
  })

  it("adds up the goals", () => {
    expect(sumScore([1, 2, 3])).toBe(6)
  })
})
