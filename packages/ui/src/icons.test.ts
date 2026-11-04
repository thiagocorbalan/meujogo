import { describe, expect, it } from "vitest"
import { ICONS, iconPath } from "./icons.ts"

describe("ICONS", () => {
  it("names every icon in kebab-case ASCII", () => {
    const invalid = ICONS.map((i) => i.name).filter((name) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name))

    expect(invalid).toEqual([])
  })

  it("never repeats a name", () => {
    const names = ICONS.map((i) => i.name)
    const repeated = names.filter((name, index) => names.indexOf(name) !== index)

    expect(repeated).toEqual([])
  })

  it("resolves a name to its MDI path", () => {
    const back = ICONS.find((i) => i.name === "back")

    expect(back).toBeDefined()
    expect(iconPath("back")).toBe(back?.path)
  })
})
