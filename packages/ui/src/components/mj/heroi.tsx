import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Padrao, type NomePadrao } from "@meujogo/ui/components/mj/padrao"

type HeroiProps = React.ComponentProps<"section"> & {
  /** Impulso no placar, no próximo jogo e na presença; ritmo na tabela da sessão. */
  padrao?: NomePadrao | null
  /** A única ação do herói: um `HeroiAcao` (ou o par `HeroiAcao` + `HeroiAcao variante="contorno"`). */
  acao?: React.ReactNode
}

/** O bloco roxo da tela, um por tela, com o número-chave. */
function Heroi({ padrao = "impulso", acao, className, children, ...props }: HeroiProps) {
  return (
    <section
      data-slot="heroi"
      className={cn("relative overflow-hidden rounded-2xl bg-hero p-5 text-white", className)}
      {...props}
    >
      {padrao ? <Padrao padrao={padrao} /> : null}
      <div className="relative flex flex-col gap-4">
        {children}
        {acao ? <div className="flex items-center gap-2">{acao}</div> : null}
      </div>
    </section>
  )
}

type HeroiNumeroProps = React.ComponentProps<"div"> & {
  valor: React.ReactNode
  rotulo?: React.ReactNode
}

/** O número-chave: Rajdhani 48 com o rótulo na linha de base. */
function HeroiNumero({ valor, rotulo, className, ...props }: HeroiNumeroProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)} {...props}>
      <span className="font-num text-5xl leading-none font-bold">{valor}</span>
      {rotulo ? <span className="text-sm font-medium text-white/90">{rotulo}</span> : null}
    </div>
  )
}

type HeroiAcaoProps = React.ComponentProps<"button"> & {
  /** `contorno` só no par de resposta ("Vou jogar" / "Não vou"), ao lado da pílula branca. */
  variante?: "cheia" | "contorno"
}

function HeroiAcao({ variante = "cheia", className, type = "button", ...props }: HeroiAcaoProps) {
  return (
    <button
      type={type}
      data-slot="heroi-acao"
      className={cn(
        "inline-flex h-button items-center justify-center gap-1.5 rounded-full px-6 font-body outline-none transition-[background-color,transform] duration-150 focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px disabled:opacity-60 [&_svg]:size-5",
        variante === "cheia"
          ? "flex-1 bg-white text-base font-bold text-roxo hover:brightness-95"
          : "border-[1.5px] border-white/60 text-[15px] font-semibold text-white hover:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

/** Pílula de informação dentro do herói (branco 12%). */
function HeroiPilula({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full bg-on-hero-12 px-3 py-1 text-[13px] font-medium text-white", className)}
      {...props}
    />
  )
}

export { Heroi, HeroiNumero, HeroiAcao, HeroiPilula }
export type { HeroiProps, HeroiNumeroProps, HeroiAcaoProps }
