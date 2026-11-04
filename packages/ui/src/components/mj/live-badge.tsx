import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"

type LiveBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  text?: string
  pulse?: boolean
}

/** Pílula vermelha "Ao vivo". O texto está sempre presente: o estado nunca depende só da cor. */
function LiveBadge({ text = "Ao vivo", pulse = true, className, ...props }: LiveBadgeProps) {
  return (
    <span
      data-slot="live-badge"
      className={cn("inline-flex h-chip shrink-0 items-center gap-1.5 rounded-full bg-live px-2.5 text-white", className)}
      {...props}
    >
      <span aria-hidden="true" className={cn("size-2 rounded-full bg-white", pulse && "motion-safe:animate-pulse")} />
      <span className="font-body text-xs leading-none font-bold">{text}</span>
    </span>
  )
}

/** Ponto de 8 px que marca a linha ao vivo numa lista de jogos; o leitor de tela ouve "ao vivo". */
function LiveDot({ className, ...props }: Omit<React.ComponentProps<"span">, "children">) {
  return (
    <span className={cn("inline-flex", className)} {...props}>
      <span aria-hidden="true" className="size-2 rounded-full bg-live" />
      <span className="sr-only">ao vivo</span>
    </span>
  )
}

export { LiveBadge, LiveDot }
export type { LiveBadgeProps }
