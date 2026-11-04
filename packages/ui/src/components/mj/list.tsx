import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"

/* ------------------------------------------------------------------ */
/* Título de seção                                                     */
/* ------------------------------------------------------------------ */

type SectionTitleProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  title: React.ReactNode
  /** Link à direita, como "Ver tudo". */
  action?: React.ReactNode
  level?: "h2" | "h3"
}

function SectionTitle({ title, action, level: H = "h2", className, ...props }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)} {...props}>
      <H className="font-display text-base font-semibold text-ink">{title}</H>
      {action ? <div className="text-sm font-semibold text-ink">{action}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Contêiner                                                           */
/* ------------------------------------------------------------------ */

type ListGroupProps = Omit<React.ComponentProps<"ul">, "title"> & {
  title?: React.ReactNode
  action?: React.ReactNode
}

/** Um só contêiner branco de raio 16 com as linhas dentro, separadas por hairline recuada. */
function ListGroup({ title, action, className, children, ...props }: ListGroupProps) {
  const list = (
    <ul data-slot="list-group" className={cn("overflow-hidden rounded-xl bg-surface", className)} {...props}>
      {children}
    </ul>
  )
  if (!title) return list
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle title={title} action={action} />
      {list}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Linha                                                               */
/* ------------------------------------------------------------------ */

const HEIGHTS = {
  compact: "h-12",
  default: "h-row",
  tall: "h-16",
} as const

type ListRowProps = {
  /** Avatar, ícone ou colete. */
  start?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
  /** Valor, chip ou ação à direita. */
  end?: React.ReactNode
  chevron?: boolean
  /** A linha do próprio usuário, em roxo 6%. */
  self?: boolean
  /** 48, 56 ou 64 px; 64 com avatar e meta. */
  height?: keyof typeof HEIGHTS
  href?: string
  onClick?: () => void
  className?: string
}

function ListRow({ start, title, meta, end, chevron, self, height = "default", href, onClick, className }: ListRowProps) {
  const body = (
    <>
      {start ? <span className="flex shrink-0 items-center">{start}</span> : null}
      <span
        className={cn(
          "flex h-full min-w-0 flex-1 items-center justify-between gap-3 border-b border-line pr-4 group-last/row:border-b-0",
          start && "ml-3"
        )}
      >
        <span className="flex min-w-0 flex-col gap-0.5 text-left">
          <span className="truncate text-[15px] leading-snug font-bold text-foreground">{title}</span>
          {meta ? <span className="truncate text-[13px] leading-tight font-medium text-muted-foreground">{meta}</span> : null}
        </span>
        {end || chevron ? (
          <span className="flex shrink-0 items-center gap-2">
            {end}
            {chevron ? <Icon path={iconPath("next")} className="size-5 text-muted-foreground" /> : null}
          </span>
        ) : null}
      </span>
    </>
  )
  const rowClass = cn("flex w-full items-center pl-4", HEIGHTS[height], self && "bg-tint-6")
  const interactiveClass = cn(rowClass, "outline-none transition-colors duration-150 hover:bg-tint-6 focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset")

  return (
    <li data-slot="list-row" data-self={self || undefined} className={cn("group/row", className)}>
      {href ? (
        <a href={href} onClick={onClick} className={interactiveClass}>
          {body}
        </a>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={interactiveClass}>
          {body}
        </button>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Chip de estado                                                      */
/* ------------------------------------------------------------------ */

type StatusChipProps = React.ComponentProps<"span"> & {
  /** Ponto de 8 px: verde para confirmado, rosa para quem não vai. Os outros estados levam ícone. */
  dot?: "confirmed" | "absent"
  icon?: string
}

/** Chip neutro com o estado escrito; a cor viva fica só no ponto. */
function StatusChip({ dot, icon: path, className, children, ...props }: StatusChipProps) {
  return (
    <span
      data-slot="status-chip"
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs font-semibold text-foreground group-data-[self]/row:bg-surface",
        className
      )}
      {...props}
    >
      {dot ? (
        <span aria-hidden="true" className={cn("size-2 rounded-full", dot === "confirmed" ? "bg-success" : "bg-error")} />
      ) : null}
      {path ? <Icon path={path} className="size-[15px] text-muted-foreground" /> : null}
      {children}
    </span>
  )
}

export { ListGroup, ListRow, StatusChip, SectionTitle }
export type { ListGroupProps, ListRowProps, StatusChipProps, SectionTitleProps }
