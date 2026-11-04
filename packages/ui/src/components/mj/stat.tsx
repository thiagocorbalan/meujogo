import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"

type StatProps = Omit<React.ComponentProps<"div">, "children"> & {
  value: React.ReactNode
  label: React.ReactNode
}

/** Número em Rajdhani 28 com o rótulo embaixo. */
function Stat({ value, label, className, ...props }: StatProps) {
  return (
    <div data-slot="stat" className={cn("flex flex-col items-center text-center", className)} {...props}>
      <span className="font-num text-[28px] leading-none font-bold text-ink">{value}</span>
      <span className="mt-1 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

/** Fileira de `Stat` com divisórias finas entre elas. */
function StatGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-group"
      className={cn("grid auto-cols-fr grid-flow-col divide-x divide-chart-grid", className)}
      {...props}
    />
  )
}

export { Stat, StatGroup }
export type { StatProps }
