import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Padrao } from "@meujogo/ui/components/mj/padrao"

/** Fundo de tela cheia do login: gradiente roxo escuro e o impulso a 6%. */
function FundoLogin({ className, style, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="fundo-login"
      className={cn("relative isolate min-h-svh w-full overflow-hidden bg-[#1A0633] bg-login text-white", className)}
      style={style}
      {...props}
    >
      <Padrao padrao="impulso" opacidade={0.06} posicao="-top-10 -right-10 size-[360px]" />
      <div className="relative">{children}</div>
    </div>
  )
}

type CartaoConviteProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** Escudo do grupo; sem ele, as iniciais. */
  escudo?: React.ReactNode
  iniciais?: string
  grupo: string
  detalhe?: React.ReactNode
  chamada?: React.ReactNode
}

/** Convite para o grupo, em branco 8% sobre o fundo do login. */
function CartaoConvite({ escudo, iniciais, grupo, detalhe, chamada = "Você foi convidado para o", className, ...props }: CartaoConviteProps) {
  return (
    <section
      data-slot="cartao-convite"
      className={cn("flex items-center gap-3.5 rounded-xl bg-white/[0.08] p-4", className)}
      {...props}
    >
      {escudo ?? (
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.16] font-display text-[13px] font-semibold text-white">
          {iniciais}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="text-sm leading-snug font-medium text-white/80">{chamada}</span>
        <span className="text-[15px] leading-snug font-bold text-white">{grupo}</span>
        {detalhe ? <span className="mt-0.5 text-[13px] leading-snug text-white/60">{detalhe}</span> : null}
      </span>
    </section>
  )
}

export { FundoLogin, CartaoConvite }
export type { CartaoConviteProps }
