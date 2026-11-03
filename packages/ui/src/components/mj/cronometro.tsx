import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"

type CronometroProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Segundos que faltam. */
  restante: number
  /** Duração total da partida em segundos; define o trilho. */
  duracao: number
  pausado?: boolean
  /** Sem handler, o botão de pausa não aparece (visão de quem só assiste). */
  onAlternar?: () => void
  rotulo?: string
}

function formatar(segundos: number) {
  const s = Math.max(0, Math.round(segundos))
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

/**
 * Cronômetro da partida, para dentro do `BlocoImersivo`. Controlado: quem conta o tempo é o
 * chamador, então pausado o trilho para porque `restante` para de mudar.
 */
function Cronometro({ restante, duracao, pausado = false, onAlternar, rotulo = "restantes", className, ...props }: CronometroProps) {
  const progresso = duracao > 0 ? Math.min(1, Math.max(0, (duracao - restante) / duracao)) : 0
  const tempo = formatar(restante)

  return (
    <div data-slot="cronometro" data-pausado={pausado || undefined} className={cn("flex flex-col items-center", className)} {...props}>
      <div className="flex items-center gap-2">
        <div className="flex h-11 min-w-[132px] items-center justify-center rounded-full bg-white px-4">
          <span
            role="timer"
            aria-label={`${tempo} ${pausado ? "pausado" : rotulo}`}
            className={cn("font-num text-[32px] leading-none font-bold text-roxo tabular-nums", pausado && "text-roxo/60")}
          >
            {tempo}
          </span>
        </div>
        {onAlternar ? (
          <button
            type="button"
            onClick={onAlternar}
            aria-label={pausado ? "Retomar" : "Pausar"}
            className="relative flex size-9 items-center justify-center rounded-full bg-white text-roxo outline-none before:absolute before:-inset-1 before:content-[''] hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px"
          >
            <Icon path={icone(pausado ? "retomar" : "pausar")} className="size-5" />
          </button>
        ) : null}
      </div>
      <span aria-hidden="true" className="mt-1.5 text-xs leading-none font-medium text-white/70">
        {pausado ? "Pausado" : rotulo}
      </span>
      <div aria-hidden="true" className="mt-2 h-1 w-[176px] overflow-hidden rounded-full bg-white/30">
        <div className="h-full rounded-full bg-white" style={{ width: `${progresso * 100}%` }} />
      </div>
    </div>
  )
}

export { Cronometro, formatar as formatarTempo }
export type { CronometroProps }
