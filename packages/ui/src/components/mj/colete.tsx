import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { icone } from "@meujogo/ui/icones"

type CorColete = "amarelo" | "vermelho" | "preto" | "azul" | "branco"

const CORES: Record<CorColete, string> = {
  amarelo: "text-colete-amarelo",
  vermelho: "text-colete-vermelho",
  preto: "text-colete-preto",
  azul: "text-colete-azul",
  branco: "text-colete-branco",
}

const NOMES: Record<CorColete, string> = {
  amarelo: "Amarelo",
  vermelho: "Vermelho",
  preto: "Preto",
  azul: "Azul",
  branco: "Branco",
}

const TAMANHOS = {
  sm: "size-4",
  md: "size-[18px]",
  lg: "size-5",
  placar: "size-[52px]",
} as const

type ColeteProps = Omit<React.ComponentProps<"svg">, "children"> & {
  cor: CorColete
  tamanho?: keyof typeof TAMANHOS
  /**
   * Fio de contorno para o colete não sumir no fundo. Por padrão só o branco tem,
   * e o preto ganha um no tema escuro; passe `false` sobre o roxo.
   */
  contorno?: boolean
  /** Nome acessível. Sem ele o colete é decorativo: ele sempre vem ao lado do nome do time. */
  rotulo?: string
}

function Colete({ cor, tamanho = "md", contorno, rotulo, className, ...props }: ColeteProps) {
  const fio = contorno ?? cor === "branco"
  return (
    <svg
      viewBox="0 0 24 24"
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      focusable="false"
      data-slot="colete"
      data-cor={cor}
      className={cn("shrink-0", TAMANHOS[tamanho], className)}
      {...props}
    >
      <path d={icone("colete")} fill="currentColor" className={CORES[cor]} />
      {fio ? <path d={icone("colete-contorno")} fill="currentColor" className="text-muted-foreground/70" /> : null}
      {contorno === undefined && cor === "preto" ? (
        <path d={icone("colete-contorno")} fill="currentColor" className="hidden text-white/60 dark:block" />
      ) : null}
    </svg>
  )
}

export { Colete, NOMES as NOMES_COLETE }
export type { ColeteProps, CorColete }
