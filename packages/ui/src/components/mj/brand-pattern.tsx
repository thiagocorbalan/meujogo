import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import impulseSvg from "@meujogo/brand/padroes/padrao-impulso-tile.svg?raw"
import rhythmSvg from "@meujogo/brand/padroes/padrao-ritmo.svg?raw"

type PatternName = "impulse" | "rhythm"

// Os arquivos da marca trazem o fundo colorido e a tinta original; dentro do app
// o padrão é só textura branca, então aproveitamos apenas a geometria.
function polygons(svg: string): string[] {
  return Array.from(svg.matchAll(/<polygon[^>]*\spoints="([^"]+)"/g), (m) => m[1])
}

const SOURCES: Record<PatternName, { viewBox: string; points: string[]; aspect?: string; position: string }> = {
  impulse: { viewBox: "0 0 400 400", points: polygons(impulseSvg), position: "-top-6 -right-10 size-[260px]" },
  rhythm: { viewBox: "0 0 1600 900", points: polygons(rhythmSvg), aspect: "xMaxYMin slice", position: "inset-0 size-full" },
}

const MASKS = {
  corner: "radial-gradient(circle at 100% 0%, #000 35%, transparent 75%)",
  diagonal: "linear-gradient(225deg, #000 30%, transparent 72%)",
} as const

type BrandPatternProps = Omit<React.ComponentProps<"svg">, "children" | "opacity"> & {
  pattern: PatternName
  /** Opacidade da tinta branca: 0.1 no herói, 0.06 no fundo do login. */
  opacity?: number
  /** De onde o padrão some: do canto superior direito em círculo, ou em diagonal. */
  fade?: keyof typeof MASKS
  /** Substitui a posição e o tamanho padrão do padrão (classes de `absolute`). */
  position?: string
}

function BrandPattern({ pattern, opacity = 0.1, fade = "corner", position, className, style, ...props }: BrandPatternProps) {
  const source = SOURCES[pattern]
  const mask = MASKS[fade]
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={source.viewBox}
      preserveAspectRatio={source.aspect}
      data-slot="brand-pattern"
      className={cn("pointer-events-none absolute", position ?? source.position, className)}
      style={{ opacity, maskImage: mask, WebkitMaskImage: mask, ...style }}
      {...props}
    >
      <g fill="#FFFFFF">
        {source.points.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
      </g>
    </svg>
  )
}

export { BrandPattern }
export type { BrandPatternProps, PatternName }
