import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import primarySvg from "@meujogo/brand/logo/meujogo-logo.svg?raw"
import symbolSvg from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"

// Os SVGs da marca trazem <title> com id fixo; repetidos na mesma página, os ids colidiriam.
// O nome acessível fica no wrapper.
function stripTitle(svg: string): string {
  return svg
    .replace(/<title[^>]*>.*?<\/title>/s, "")
    .replace(/\s(role|aria-labelledby)="[^"]*"/g, "")
    .replace(/<svg /, '<svg aria-hidden="true" focusable="false" ')
}

const SVGS = { primary: stripTitle(primarySvg), symbol: stripTitle(symbolSvg) }

type BrandMarkProps = Omit<React.ComponentProps<"span">, "children" | "dangerouslySetInnerHTML"> & {
  variant?: keyof typeof SVGS
  /** Nome acessível; vazio torna a marca decorativa. */
  label?: string
}

/** A marca em uma tinta só (`currentColor`): roxo sobre neutro, branco sobre o roxo. Altura pela classe. */
function BrandMark({ variant = "primary", label = "Meu Jogo", className, ...props }: BrandMarkProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-slot="brand-mark"
      className={cn("inline-block shrink-0 leading-none [&>svg]:block [&>svg]:h-full [&>svg]:w-auto", className)}
      dangerouslySetInnerHTML={{ __html: SVGS[variant] }}
      {...props}
    />
  )
}

export { BrandMark }
export type { BrandMarkProps }
