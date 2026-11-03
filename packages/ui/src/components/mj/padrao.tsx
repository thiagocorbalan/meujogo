import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import impulsoSvg from "@meujogo/brand/padroes/padrao-impulso-tile.svg?raw"
import ritmoSvg from "@meujogo/brand/padroes/padrao-ritmo.svg?raw"

type NomePadrao = "impulso" | "ritmo"

// Os arquivos da marca trazem o fundo colorido e a tinta original; dentro do app
// o padrão é só textura branca, então aproveitamos apenas a geometria.
function poligonos(svg: string): string[] {
  return Array.from(svg.matchAll(/<polygon[^>]*\spoints="([^"]+)"/g), (m) => m[1])
}

const FONTES: Record<NomePadrao, { viewBox: string; pontos: string[]; aspecto?: string; posicao: string }> = {
  impulso: { viewBox: "0 0 400 400", pontos: poligonos(impulsoSvg), posicao: "-top-6 -right-10 size-[260px]" },
  ritmo: { viewBox: "0 0 1600 900", pontos: poligonos(ritmoSvg), aspecto: "xMaxYMin slice", posicao: "inset-0 size-full" },
}

const MASCARAS = {
  canto: "radial-gradient(circle at 100% 0%, #000 35%, transparent 75%)",
  diagonal: "linear-gradient(225deg, #000 30%, transparent 72%)",
} as const

type PadraoProps = Omit<React.ComponentProps<"svg">, "children"> & {
  padrao: NomePadrao
  /** Opacidade da tinta branca: 0.1 no herói, 0.06 no fundo do login. */
  opacidade?: number
  /** De onde o padrão some: do canto superior direito em círculo, ou em diagonal. */
  esmaecer?: keyof typeof MASCARAS
  /** Substitui a posição e o tamanho padrão do padrão (classes de `absolute`). */
  posicao?: string
}

function Padrao({ padrao, opacidade = 0.1, esmaecer = "canto", posicao, className, style, ...props }: PadraoProps) {
  const fonte = FONTES[padrao]
  const mascara = MASCARAS[esmaecer]
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={fonte.viewBox}
      preserveAspectRatio={fonte.aspecto}
      data-slot="padrao"
      className={cn("pointer-events-none absolute", posicao ?? fonte.posicao, className)}
      style={{ opacity: opacidade, maskImage: mascara, WebkitMaskImage: mascara, ...style }}
      {...props}
    >
      <g fill="#FFFFFF">
        {fonte.pontos.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
      </g>
    </svg>
  )
}

export { Padrao }
export type { PadraoProps, NomePadrao }
