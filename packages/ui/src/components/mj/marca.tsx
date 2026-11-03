import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import principalSvg from "@meujogo/brand/logo/meujogo-logo.svg?raw"
import simboloSvg from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"

// Os SVGs da marca trazem <title> com id fixo; repetidos na mesma página, os ids colidiriam.
// O nome acessível fica no wrapper.
function limpar(svg: string): string {
  return svg
    .replace(/<title[^>]*>.*?<\/title>/s, "")
    .replace(/\s(role|aria-labelledby)="[^"]*"/g, "")
    .replace(/<svg /, '<svg aria-hidden="true" focusable="false" ')
}

const SVGS = { principal: limpar(principalSvg), simbolo: limpar(simboloSvg) }

type MarcaProps = Omit<React.ComponentProps<"span">, "children" | "dangerouslySetInnerHTML"> & {
  versao?: keyof typeof SVGS
  /** Nome acessível; vazio torna a marca decorativa. */
  rotulo?: string
}

/** A marca em uma tinta só (`currentColor`): roxo sobre neutro, branco sobre o roxo. Altura pela classe. */
function Marca({ versao = "principal", rotulo = "Meu Jogo", className, ...props }: MarcaProps) {
  return (
    <span
      role={rotulo ? "img" : undefined}
      aria-label={rotulo || undefined}
      aria-hidden={rotulo ? undefined : true}
      data-slot="marca"
      className={cn("inline-block shrink-0 leading-none [&>svg]:block [&>svg]:h-full [&>svg]:w-auto", className)}
      dangerouslySetInnerHTML={{ __html: SVGS[versao] }}
      {...props}
    />
  )
}

export { Marca }
export type { MarcaProps }
