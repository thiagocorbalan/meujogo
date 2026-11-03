import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"

type EstatisticaProps = Omit<React.ComponentProps<"div">, "children"> & {
  valor: React.ReactNode
  rotulo: React.ReactNode
}

/** Número em Rajdhani 28 com o rótulo embaixo. */
function Estatistica({ valor, rotulo, className, ...props }: EstatisticaProps) {
  return (
    <div data-slot="estatistica" className={cn("flex flex-col items-center text-center", className)} {...props}>
      <span className="font-num text-[28px] leading-none font-bold text-ink">{valor}</span>
      <span className="mt-1 text-xs font-medium text-muted-foreground">{rotulo}</span>
    </div>
  )
}

/** Fileira de `Estatistica` com divisórias finas entre elas. */
function GrupoEstatisticas({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="grupo-estatisticas"
      className={cn("grid auto-cols-fr grid-flow-col divide-x divide-chart-grid", className)}
      {...props}
    />
  )
}

export { Estatistica, GrupoEstatisticas }
export type { EstatisticaProps }
