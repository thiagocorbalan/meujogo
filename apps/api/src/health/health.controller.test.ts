import { Test } from "@nestjs/testing"
import { healthResponseSchema } from "@meujogo/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HealthController } from "./health.controller.js"

describe("HealthController", () => {
  let controller: HealthController

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    controller = moduleRef.get(HealthController)
  })

  it("reports the API as ok", () => {
    expect(controller.check()).toEqual({ status: "ok" })
  })

  it("validates the response with the shared schema", () => {
    const parse = vi.spyOn(healthResponseSchema, "parse")

    controller.check()

    expect(parse).toHaveBeenCalledWith({ status: "ok" })
    parse.mockRestore()
  })
})
