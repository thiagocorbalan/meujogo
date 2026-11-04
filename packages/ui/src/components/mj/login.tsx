import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { BrandPattern } from "@meujogo/ui/components/mj/brand-pattern"

/** Fundo de tela cheia do login: gradiente roxo escuro e o impulso a 6%. */
function LoginBackground({ className, style, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="login-background"
      className={cn("relative isolate min-h-svh w-full overflow-hidden bg-[#1A0633] bg-login text-white", className)}
      style={style}
      {...props}
    >
      <BrandPattern pattern="impulse" opacity={0.06} position="-top-10 -right-10 size-[360px]" />
      <div className="relative">{children}</div>
    </div>
  )
}

type InviteCardProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** Escudo do grupo; sem ele, as iniciais. */
  crest?: React.ReactNode
  initials?: string
  group: string
  detail?: React.ReactNode
  lead?: React.ReactNode
}

/** Convite para o grupo, em branco 8% sobre o fundo do login. */
function InviteCard({ crest, initials, group, detail, lead = "Você foi convidado para o", className, ...props }: InviteCardProps) {
  return (
    <section
      data-slot="invite-card"
      className={cn("flex items-center gap-3.5 rounded-xl bg-white/[0.08] p-4", className)}
      {...props}
    >
      {crest ?? (
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.16] font-display text-[13px] font-semibold text-white">
          {initials}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="text-sm leading-snug font-medium text-white/80">{lead}</span>
        <span className="text-[15px] leading-snug font-bold text-white">{group}</span>
        {detail ? <span className="mt-0.5 text-[13px] leading-snug text-white/60">{detail}</span> : null}
      </span>
    </section>
  )
}

export { LoginBackground, InviteCard }
export type { InviteCardProps }
