import { sumGoals } from "@meujogo/engines"
import { healthResponseSchema } from "@meujogo/shared"

export default function Page() {
  const contract = healthResponseSchema.parse({ status: "ok" })
  const goals = sumGoals([2, 1])

  return (
    <main>
      <h1>Meu Jogo</h1>
      <p>
        Contrato do /health: {contract.status} · 2 + 1 = {goals} gols
      </p>
    </main>
  )
}
