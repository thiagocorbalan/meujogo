import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Vest, type VestColor } from "@meujogo/ui/components/mj/vest"

type ScoreboardTeam = {
  color: VestColor
  name: string
  goals: number
  /** Uma linha por gol: "Guga 2'", "Rafa 5' pen". */
  scorers?: string[]
}

type ScoreboardProps = Omit<React.ComponentProps<"div">, "children"> & {
  home: ScoreboardTeam
  away: ScoreboardTeam
}

function ScoreboardSide({ team }: { team: ScoreboardTeam }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span className="mb-2 flex size-[72px] items-center justify-center rounded-full bg-on-hero-12">
        <Vest color={team.color} size="scoreboard" outline={false} />
      </span>
      <span className="text-sm leading-tight font-semibold whitespace-nowrap text-white">{team.name}</span>
      {team.scorers?.length ? (
        <span className="mt-1 flex flex-col text-xs leading-tight font-medium text-white/75">
          {team.scorers.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </span>
      ) : null}
    </div>
  )
}

/** Placar da partida, para dentro do `ImmersiveBlock`. */
function Scoreboard({ home, away, className, ...props }: ScoreboardProps) {
  return (
    <div data-slot="scoreboard" className={cn("grid grid-cols-[1fr_auto_1fr] items-start", className)} {...props}>
      <ScoreboardSide team={home} />
      <p
        aria-label={`${home.name} ${home.goals}, ${away.name} ${away.goals}`}
        className="pt-2 font-num text-[64px] leading-none font-bold tracking-tight whitespace-nowrap text-white"
      >
        {home.goals} × {away.goals}
      </p>
      <ScoreboardSide team={away} />
    </div>
  )
}

export { Scoreboard }
export type { ScoreboardProps, ScoreboardTeam }
