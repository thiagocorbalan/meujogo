import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"
import { Vest, type VestColor } from "@meujogo/ui/components/mj/vest"
import { PlayerAvatar } from "@meujogo/ui/components/mj/player-avatar"

const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-ring"

/* ------------------------------------------------------------------ */
/* Painel de um time na aba Marcar                                     */
/* ------------------------------------------------------------------ */

type TeamPanelProps = Omit<React.ComponentProps<"section">, "children" | "color"> & {
  color: VestColor
  name: string
  goals: number
  /** `PlayerRow`, o goleiro primeiro. */
  children: React.ReactNode
}

function TeamPanel({ color, name, goals, className, children, ...props }: TeamPanelProps) {
  const id = React.useId()
  return (
    <section
      aria-labelledby={id}
      data-slot="team-panel"
      className={cn("min-w-0 overflow-hidden rounded-xl border border-line bg-surface", className)}
      {...props}
    >
      <header className="flex h-11 items-center gap-1.5 border-b border-line px-3">
        <Vest color={color} size="md" />
        <h3 id={id} className="truncate font-body text-sm font-bold text-foreground">
          {name}
        </h3>
        <span className="ml-auto font-num text-xl leading-none font-bold text-ink" aria-label={`${goals} gols`}>
          {goals}
        </span>
      </header>
      <ul>{children}</ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Linha de toque: tocar marca o gol                                   */
/* ------------------------------------------------------------------ */

type PlayerRowProps = {
  name: string
  initials: string
  photo?: string
  tone?: "purple" | "light"
  /** Gols do jogador nesta partida. */
  goals?: number
  goalkeeper?: boolean
  onScore?: () => void
  disabled?: boolean
  className?: string
}

function PlayerRow({ name, initials, photo, tone, goals = 0, goalkeeper, onScore, disabled, className }: PlayerRowProps) {
  return (
    <li className={cn("relative before:absolute before:top-0 before:right-0 before:left-3 before:h-px before:bg-line first:before:hidden", className)}>
      <button
        type="button"
        onClick={onScore}
        disabled={disabled}
        aria-label={`Marcar gol de ${name}${goalkeeper ? ", goleiro" : ""}${goals ? `, ${goals} ${goals === 1 ? "gol" : "gols"} na partida` : ""}`}
        className={cn(
          "flex w-full items-center gap-2 pr-2.5 pl-3 text-left transition-colors duration-150 hover:bg-tint-6 active:bg-tint-10 disabled:opacity-50",
          goalkeeper ? "h-[52px]" : "h-12",
          focusRing,
          "focus-visible:ring-inset"
        )}
      >
        <PlayerAvatar initials={initials} photo={photo} tone={tone} size={32} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-semibold text-foreground">{name}</span>
          {goalkeeper ? <span className="text-[11px] leading-tight font-medium text-muted-foreground">goleiro</span> : null}
        </span>
        {goals > 0 ? (
          <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-tint-10 px-1.5 font-num text-[13px] leading-none font-bold text-ink">
            {goals}
          </span>
        ) : null}
        <span aria-hidden="true" className="ml-auto flex shrink-0 items-center text-ink">
          <Icon path={iconPath("add")} className="size-3" />
          <Icon path={iconPath("goal")} className="size-4" />
        </span>
      </button>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Ações do operador                                                   */
/* ------------------------------------------------------------------ */

type OperatorActionsProps = Omit<React.ComponentProps<"div">, "children"> & {
  onOwnGoal?: () => void
  onPenalty?: () => void
  onUndo?: () => void
  /** Sem evento do próprio operador para desfazer. */
  undoDisabled?: boolean
  onFinish?: () => void
}

function SecondaryAction({
  icons,
  label,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & { icons: [string, string?]; label: string }) {
  const [main, extra] = icons
  return (
    <button
      type="button"
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-tint-10 px-1 text-ink transition-[filter,transform] duration-150 hover:brightness-95 active:translate-y-px disabled:opacity-45",
        focusRing
      )}
      {...props}
    >
      <span aria-hidden="true" className="flex items-center">
        <Icon path={main} className="size-5" />
        {extra ? <Icon path={extra} className="size-4" /> : null}
      </span>
      <span className="text-[13px] leading-none font-bold">{label}</span>
    </button>
  )
}

function OperatorActions({
  onOwnGoal,
  onPenalty,
  onUndo,
  undoDisabled,
  onFinish,
  className,
  ...props
}: OperatorActionsProps) {
  return (
    <div data-slot="operator-actions" className={cn("flex flex-col gap-4", className)} {...props}>
      <div className="grid grid-cols-3 gap-2">
        <SecondaryAction icons={[iconPath("goal"), iconPath("substitution")]} label="Gol contra" onClick={onOwnGoal} />
        <SecondaryAction icons={[iconPath("penalty")]} label="Pênalti" onClick={onPenalty} />
        <SecondaryAction icons={[iconPath("undo")]} label="Desfazer último" onClick={onUndo} disabled={undoDisabled} />
      </div>
      {onFinish ? (
        <button
          type="button"
          onClick={onFinish}
          className={cn("h-11 self-center rounded-full px-4 text-[15px] font-bold text-error-ink hover:bg-tint-6", focusRing)}
        >
          Encerrar partida
        </button>
      ) : null}
    </div>
  )
}

export { TeamPanel, PlayerRow, OperatorActions }
export type { TeamPanelProps, PlayerRowProps, OperatorActionsProps }
