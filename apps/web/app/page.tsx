import { sumScore } from "@meujogo/engines"
import { healthResponseSchema } from "@meujogo/shared"

export default function Page() {
  const health = healthResponseSchema.parse({ status: "ok" })
  const goals = sumScore([2, 1])

  return (
    <main>
      <h1>Meu Jogo</h1>
      <p>
        API: {health.status} · placar 2 x 1 = {goals} gols
      </p>
    </main>
  )
}
