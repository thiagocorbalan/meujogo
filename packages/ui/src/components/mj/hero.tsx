import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { BrandPattern, type PatternName } from "@meujogo/ui/components/mj/brand-pattern"

type HeroProps = React.ComponentProps<"section"> & {
  /** Impulso no placar, no próximo jogo e na presença; ritmo na tabela da sessão. */
  pattern?: PatternName | null
  /** A única ação do herói: um `HeroAction` (ou o par `HeroAction` + `HeroAction variant="outline"`). */
  action?: React.ReactNode
}

/** O bloco roxo da tela, um por tela, com o número-chave. */
function Hero({ pattern = "impulse", action, className, children, ...props }: HeroProps) {
  return (
    <section
      data-slot="hero"
      className={cn("relative overflow-hidden rounded-2xl bg-hero p-5 text-white", className)}
      {...props}
    >
      {pattern ? <BrandPattern pattern={pattern} /> : null}
      <div className="relative flex flex-col gap-4">
        {children}
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
    </section>
  )
}

type HeroNumberProps = React.ComponentProps<"div"> & {
  value: React.ReactNode
  label?: React.ReactNode
}

/** O número-chave: Rajdhani 48 com o rótulo na linha de base. */
function HeroNumber({ value, label, className, ...props }: HeroNumberProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)} {...props}>
      <span className="font-num text-5xl leading-none font-bold">{value}</span>
      {label ? <span className="text-sm font-medium text-white/90">{label}</span> : null}
    </div>
  )
}

type HeroActionProps = React.ComponentProps<"button"> & {
  /** `outline` só no par de resposta ("Vou jogar" / "Não vou"), ao lado da pílula branca. */
  variant?: "filled" | "outline"
}

function HeroAction({ variant = "filled", className, type = "button", ...props }: HeroActionProps) {
  return (
    <button
      type={type}
      data-slot="hero-action"
      className={cn(
        "inline-flex h-button items-center justify-center gap-1.5 rounded-full px-6 font-body outline-none transition-[background-color,transform] duration-150 focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px disabled:opacity-60 [&_svg]:size-5",
        variant === "filled"
          ? "flex-1 bg-white text-base font-bold text-purple hover:brightness-95"
          : "border-[1.5px] border-white/60 text-[15px] font-semibold text-white hover:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

/** Pílula de informação dentro do herói (branco 12%). */
function HeroPill({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full bg-on-hero-12 px-3 py-1 text-[13px] font-medium text-white", className)}
      {...props}
    />
  )
}

export { Hero, HeroNumber, HeroAction, HeroPill }
export type { HeroProps, HeroNumberProps, HeroActionProps }
