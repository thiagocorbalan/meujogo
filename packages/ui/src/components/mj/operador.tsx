import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"
import { Colete, type CorColete } from "@meujogo/ui/components/mj/colete"
import { AvatarJogador } from "@meujogo/ui/components/mj/avatar-jogador"

const foco = "outline-none focus-visible:ring-3 focus-visible:ring-ring"

/* ------------------------------------------------------------------ */
/* Painel de um time na aba Marcar                                     */
/* ------------------------------------------------------------------ */

type PainelTimeProps = Omit<React.ComponentProps<"section">, "children"> & {
  cor: CorColete
  nome: string
  gols: number
  /** `LinhaJogador`, o goleiro primeiro. */
  children: React.ReactNode
}

function PainelTime({ cor, nome, gols, className, children, ...props }: PainelTimeProps) {
  const id = React.useId()
  return (
    <section
      aria-labelledby={id}
      data-slot="painel-time"
      className={cn("min-w-0 overflow-hidden rounded-xl border border-line bg-surface", className)}
      {...props}
    >
      <header className="flex h-11 items-center gap-1.5 border-b border-line px-3">
        <Colete cor={cor} tamanho="md" />
        <h3 id={id} className="truncate font-body text-sm font-bold text-foreground">
          {nome}
        </h3>
        <span className="ml-auto font-num text-xl leading-none font-bold text-ink" aria-label={`${gols} gols`}>
          {gols}
        </span>
      </header>
      <ul>{children}</ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Linha de toque: tocar marca o gol                                   */
/* ------------------------------------------------------------------ */

type LinhaJogadorProps = {
  nome: string
  iniciais: string
  foto?: string
  tom?: "roxo" | "claro"
  /** Gols do jogador nesta partida. */
  gols?: number
  goleiro?: boolean
  onMarcar?: () => void
  disabled?: boolean
  className?: string
}

function LinhaJogador({ nome, iniciais, foto, tom, gols = 0, goleiro, onMarcar, disabled, className }: LinhaJogadorProps) {
  return (
    <li className={cn("relative before:absolute before:top-0 before:right-0 before:left-3 before:h-px before:bg-line first:before:hidden", className)}>
      <button
        type="button"
        onClick={onMarcar}
        disabled={disabled}
        aria-label={`Marcar gol de ${nome}${goleiro ? ", goleiro" : ""}${gols ? `, ${gols} ${gols === 1 ? "gol" : "gols"} na partida` : ""}`}
        className={cn(
          "flex w-full items-center gap-2 pr-2.5 pl-3 text-left transition-colors duration-150 hover:bg-tint-6 active:bg-tint-10 disabled:opacity-50",
          goleiro ? "h-[52px]" : "h-12",
          foco,
          "focus-visible:ring-inset"
        )}
      >
        <AvatarJogador iniciais={iniciais} foto={foto} tom={tom} tamanho={32} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-semibold text-foreground">{nome}</span>
          {goleiro ? <span className="text-[11px] leading-tight font-medium text-muted-foreground">goleiro</span> : null}
        </span>
        {gols > 0 ? (
          <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-tint-10 px-1.5 font-num text-[13px] leading-none font-bold text-ink">
            {gols}
          </span>
        ) : null}
        <span aria-hidden="true" className="ml-auto flex shrink-0 items-center text-ink">
          <Icon path={icone("adicionar")} className="size-3" />
          <Icon path={icone("gol")} className="size-4" />
        </span>
      </button>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Ações do operador                                                   */
/* ------------------------------------------------------------------ */

type AcoesOperadorProps = Omit<React.ComponentProps<"div">, "children"> & {
  onGolContra?: () => void
  onPenalti?: () => void
  onDesfazer?: () => void
  /** Sem evento do próprio operador para desfazer. */
  desfazerDesabilitado?: boolean
  onEncerrar?: () => void
}

function AcaoSecundaria({
  icones,
  rotulo,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & { icones: [string, string?]; rotulo: string }) {
  const [principal, extra] = icones
  return (
    <button
      type="button"
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-tint-10 px-1 text-ink transition-[filter,transform] duration-150 hover:brightness-95 active:translate-y-px disabled:opacity-45",
        foco
      )}
      {...props}
    >
      <span aria-hidden="true" className="flex items-center">
        <Icon path={principal} className="size-5" />
        {extra ? <Icon path={extra} className="size-4" /> : null}
      </span>
      <span className="text-[13px] leading-none font-bold">{rotulo}</span>
    </button>
  )
}

function AcoesOperador({
  onGolContra,
  onPenalti,
  onDesfazer,
  desfazerDesabilitado,
  onEncerrar,
  className,
  ...props
}: AcoesOperadorProps) {
  return (
    <div data-slot="acoes-operador" className={cn("flex flex-col gap-4", className)} {...props}>
      <div className="grid grid-cols-3 gap-2">
        <AcaoSecundaria icones={[icone("gol"), icone("substituicao")]} rotulo="Gol contra" onClick={onGolContra} />
        <AcaoSecundaria icones={[icone("penalti")]} rotulo="Pênalti" onClick={onPenalti} />
        <AcaoSecundaria icones={[icone("desfazer")]} rotulo="Desfazer último" onClick={onDesfazer} disabled={desfazerDesabilitado} />
      </div>
      {onEncerrar ? (
        <button
          type="button"
          onClick={onEncerrar}
          className={cn("h-11 self-center rounded-full px-4 text-[15px] font-bold text-error-ink hover:bg-tint-6", foco)}
        >
          Encerrar partida
        </button>
      ) : null}
    </div>
  )
}

export { PainelTime, LinhaJogador, AcoesOperador }
export type { PainelTimeProps, LinhaJogadorProps, AcoesOperadorProps }
