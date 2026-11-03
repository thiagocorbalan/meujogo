import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"

/* ------------------------------------------------------------------ */
/* Título de seção                                                     */
/* ------------------------------------------------------------------ */

type TituloSecaoProps = Omit<React.ComponentProps<"div">, "children"> & {
  titulo: React.ReactNode
  /** Link à direita, como "Ver tudo". */
  acao?: React.ReactNode
  nivel?: "h2" | "h3"
}

function TituloSecao({ titulo, acao, nivel: H = "h2", className, ...props }: TituloSecaoProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)} {...props}>
      <H className="font-display text-base font-semibold text-ink">{titulo}</H>
      {acao ? <div className="text-sm font-semibold text-ink">{acao}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Contêiner                                                           */
/* ------------------------------------------------------------------ */

type ListaGrupoProps = React.ComponentProps<"ul"> & {
  titulo?: React.ReactNode
  acao?: React.ReactNode
}

/** Um só contêiner branco de raio 16 com as linhas dentro, separadas por hairline recuada. */
function ListaGrupo({ titulo, acao, className, children, ...props }: ListaGrupoProps) {
  const lista = (
    <ul data-slot="lista-grupo" className={cn("overflow-hidden rounded-xl bg-surface", className)} {...props}>
      {children}
    </ul>
  )
  if (!titulo) return lista
  return (
    <section className="flex flex-col gap-2">
      <TituloSecao titulo={titulo} acao={acao} />
      {lista}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Linha                                                               */
/* ------------------------------------------------------------------ */

const ALTURAS = {
  compacta: "h-12",
  padrao: "h-row",
  alta: "h-16",
} as const

type LinhaListaProps = {
  /** Avatar, ícone ou colete. */
  inicio?: React.ReactNode
  titulo: React.ReactNode
  meta?: React.ReactNode
  /** Valor, chip ou ação à direita. */
  fim?: React.ReactNode
  chevron?: boolean
  /** A linha do próprio usuário, em roxo 6%. */
  eu?: boolean
  /** 48, 56 ou 64 px; 64 com avatar e meta. */
  altura?: keyof typeof ALTURAS
  href?: string
  onClick?: () => void
  className?: string
}

function LinhaLista({ inicio, titulo, meta, fim, chevron, eu, altura = "padrao", href, onClick, className }: LinhaListaProps) {
  const corpo = (
    <>
      {inicio ? <span className="flex shrink-0 items-center">{inicio}</span> : null}
      <span
        className={cn(
          "flex h-full min-w-0 flex-1 items-center justify-between gap-3 border-b border-line pr-4 group-last/linha:border-b-0",
          inicio && "ml-3"
        )}
      >
        <span className="flex min-w-0 flex-col gap-0.5 text-left">
          <span className="truncate text-[15px] leading-snug font-bold text-foreground">{titulo}</span>
          {meta ? <span className="truncate text-[13px] leading-tight font-medium text-muted-foreground">{meta}</span> : null}
        </span>
        {fim || chevron ? (
          <span className="flex shrink-0 items-center gap-2">
            {fim}
            {chevron ? <Icon path={icone("avancar")} className="size-5 text-muted-foreground" /> : null}
          </span>
        ) : null}
      </span>
    </>
  )
  const classe = cn("flex w-full items-center pl-4", ALTURAS[altura], eu && "bg-tint-6")
  const interativa = cn(classe, "outline-none transition-colors duration-150 hover:bg-tint-6 focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset")

  return (
    <li data-slot="linha-lista" data-eu={eu || undefined} className={cn("group/linha", className)}>
      {href ? (
        <a href={href} onClick={onClick} className={interativa}>
          {corpo}
        </a>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={interativa}>
          {corpo}
        </button>
      ) : (
        <div className={classe}>{corpo}</div>
      )}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Chip de estado                                                      */
/* ------------------------------------------------------------------ */

type ChipEstadoProps = React.ComponentProps<"span"> & {
  /** Ponto de 8 px: verde para confirmado, rosa para quem não vai. Os outros estados levam ícone. */
  ponto?: "confirmado" | "ausente"
  icone?: string
}

/** Chip neutro com o estado escrito; a cor viva fica só no ponto. */
function ChipEstado({ ponto, icone: path, className, children, ...props }: ChipEstadoProps) {
  return (
    <span
      data-slot="chip-estado"
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs font-semibold text-foreground group-data-[eu]/linha:bg-surface",
        className
      )}
      {...props}
    >
      {ponto ? (
        <span aria-hidden="true" className={cn("size-2 rounded-full", ponto === "confirmado" ? "bg-success" : "bg-error")} />
      ) : null}
      {path ? <Icon path={path} className="size-[15px] text-muted-foreground" /> : null}
      {children}
    </span>
  )
}

export { ListaGrupo, LinhaLista, ChipEstado, TituloSecao }
export type { ListaGrupoProps, LinhaListaProps, ChipEstadoProps, TituloSecaoProps }
