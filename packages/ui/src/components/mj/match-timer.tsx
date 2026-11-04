import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"

type MatchTimerProps = Omit<React.ComponentProps<"div">, "children" | "onToggle"> & {
  /** Segundos que faltam. */
  remaining: number
  /** Duração total da partida em segundos; define o trilho. */
  duration: number
  paused?: boolean
  /** Sem handler, o botão de pausa não aparece (visão de quem só assiste). */
  onToggle?: () => void
  label?: string
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

/**
 * Cronômetro da partida, para dentro do `ImmersiveBlock`. Controlado: quem conta o tempo é o
 * chamador, então pausado o trilho para porque `remaining` para de mudar.
 */
function MatchTimer({ remaining, duration, paused = false, onToggle, label = "restantes", className, ...props }: MatchTimerProps) {
  const progress = duration > 0 ? Math.min(1, Math.max(0, (duration - remaining) / duration)) : 0
  const time = formatTime(remaining)

  return (
    <div data-slot="match-timer" data-paused={paused || undefined} className={cn("flex flex-col items-center", className)} {...props}>
      <div className="flex items-center gap-2">
        <div className="flex h-11 min-w-[132px] items-center justify-center rounded-full bg-white px-4">
          <span
            role="timer"
            aria-label={`${time} ${paused ? "pausado" : label}`}
            className={cn("font-num text-[32px] leading-none font-bold text-purple tabular-nums", paused && "text-purple/60")}
          >
            {time}
          </span>
        </div>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={paused ? "Retomar" : "Pausar"}
            className="relative flex size-9 items-center justify-center rounded-full bg-white text-purple outline-none before:absolute before:-inset-1 before:content-[''] hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px"
          >
            <Icon path={iconPath(paused ? "resume" : "pause")} className="size-5" />
          </button>
        ) : null}
      </div>
      <span aria-hidden="true" className="mt-1.5 text-xs leading-none font-medium text-white/70">
        {paused ? "Pausado" : label}
      </span>
      <div aria-hidden="true" className="mt-2 h-1 w-[176px] overflow-hidden rounded-full bg-white/30">
        <div className="h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}

export { MatchTimer, formatTime }
export type { MatchTimerProps }
