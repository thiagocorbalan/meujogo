import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Colete, type CorColete } from "@meujogo/ui/components/mj/colete"

type TimePlacar = {
  cor: CorColete
  nome: string
  gols: number
  /** Uma linha por gol: "Guga 2'", "Rafa 5' pen". */
  marcadores?: string[]
}

type PlacarProps = Omit<React.ComponentProps<"div">, "children"> & {
  casa: TimePlacar
  visitante: TimePlacar
}

function LadoPlacar({ time }: { time: TimePlacar }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span className="mb-2 flex size-[72px] items-center justify-center rounded-full bg-on-hero-12">
        <Colete cor={time.cor} tamanho="placar" contorno={false} />
      </span>
      <span className="text-sm leading-tight font-semibold whitespace-nowrap text-white">{time.nome}</span>
      {time.marcadores?.length ? (
        <span className="mt-1 flex flex-col text-xs leading-tight font-medium text-white/75">
          {time.marcadores.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </span>
      ) : null}
    </div>
  )
}

/** Placar da partida, para dentro do `BlocoImersivo`. */
function Placar({ casa, visitante, className, ...props }: PlacarProps) {
  return (
    <div data-slot="placar" className={cn("grid grid-cols-[1fr_auto_1fr] items-start", className)} {...props}>
      <LadoPlacar time={casa} />
      <p
        aria-label={`${casa.nome} ${casa.gols}, ${visitante.nome} ${visitante.gols}`}
        className="pt-2 font-num text-[64px] leading-none font-bold tracking-tight whitespace-nowrap text-white"
      >
        {casa.gols} × {visitante.gols}
      </p>
      <LadoPlacar time={visitante} />
    </div>
  )
}

export { Placar }
export type { PlacarProps, TimePlacar }
