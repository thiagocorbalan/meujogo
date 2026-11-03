import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"
import { Marca } from "@meujogo/ui/components/mj/marca"
import { Padrao, type NomePadrao } from "@meujogo/ui/components/mj/padrao"

const foco = "outline-none focus-visible:ring-3 focus-visible:ring-ring"

/* ------------------------------------------------------------------ */
/* Botão redondo do topo                                               */
/* ------------------------------------------------------------------ */

type BotaoTopoProps = Omit<React.ComponentProps<"button">, "children"> & {
  /** Path MDI (ver `icone()` em `@meujogo/ui/icones`). */
  icone: string
  rotulo: string
  /** `claro` no topo branco, `imersivo` sobre o roxo, `nu` sem fundo (sino). */
  tom?: "claro" | "imersivo" | "nu"
  children?: React.ReactNode
}

const TONS_BOTAO = {
  claro: "bg-tint-10 text-ink hover:bg-tint-6",
  imersivo: "bg-on-hero-14 text-white hover:bg-white/20",
  nu: "text-fg-2 hover:bg-tint-6",
} as const

/** 40 px visíveis, 44 px de área de toque. */
function BotaoTopo({ icone: path, rotulo, tom = "claro", className, children, type = "button", ...props }: BotaoTopoProps) {
  return (
    <button
      type={type}
      aria-label={rotulo}
      data-slot="botao-topo"
      className={cn(
        "relative inline-flex size-header-btn shrink-0 items-center justify-center rounded-full transition-colors duration-150 before:absolute before:-inset-0.5 before:content-['']",
        TONS_BOTAO[tom],
        foco,
        className
      )}
      {...props}
    >
      <Icon path={path} className="size-[22px]" />
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Raiz: as cinco abas                                                 */
/* ------------------------------------------------------------------ */

type HeaderRaizProps = {
  grupo: string
  /** `principal` só no Início; nas outras abas, o símbolo. */
  marca?: "simbolo" | "principal"
  onTrocarGrupo?: () => void
  notificacoes?: number
  onNotificacoes?: () => void
  /** Normalmente um `AvatarJogador` de 32 px. */
  avatar: React.ReactNode
  onPerfil?: () => void
  titulo?: React.ReactNode
  meta?: React.ReactNode
  /** Na rolagem o título grande sai e a linha de cima ganha hairline. */
  recolhido?: boolean
  className?: string
}

function HeaderRaiz({
  grupo,
  marca = "simbolo",
  onTrocarGrupo,
  notificacoes = 0,
  onNotificacoes,
  avatar,
  onPerfil,
  titulo,
  meta,
  recolhido = false,
  className,
}: HeaderRaizProps) {
  const principal = marca === "principal"
  const contagem = notificacoes > 9 ? "9+" : String(notificacoes)

  return (
    <div data-slot="header-raiz" className={className}>
      <header
        className={cn(
          "flex h-topbar items-center justify-between gap-2 bg-surface px-4",
          recolhido && "border-b border-line"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {principal ? (
            <>
              <Marca versao="principal" className="h-[26px] text-ink" />
              <span aria-hidden="true" className="h-6 w-px shrink-0 bg-line" />
            </>
          ) : null}
          <button
            type="button"
            onClick={onTrocarGrupo}
            aria-label={`Trocar de grupo, ${grupo}`}
            className={cn(
              "relative flex h-header-btn min-w-0 items-center rounded-full text-ink before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-['']",
              principal ? "gap-0.5 pr-1 font-body text-sm font-semibold" : "-ml-1 gap-2 pr-2 pl-1 font-display text-base font-semibold",
              foco
            )}
          >
            {principal ? null : <Marca versao="simbolo" rotulo="" className="h-7" />}
            <span className="truncate">{grupo}</span>
            <Icon path={icone("expandir")} className={principal ? "size-[18px]" : "size-5"} />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <BotaoTopo
            tom="nu"
            icone={icone("notificacao-contorno")}
            rotulo={notificacoes > 0 ? `Notificações, ${notificacoes} novas` : "Notificações"}
            onClick={onNotificacoes}
          >
            {notificacoes > 0 ? (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-roxo px-1 font-num text-[11px] leading-none font-bold text-white dark:bg-lavanda dark:text-roxo"
              >
                {contagem}
              </span>
            ) : null}
          </BotaoTopo>
          {onPerfil ? (
            <button
              type="button"
              onClick={onPerfil}
              aria-label="Perfil"
              className={cn("relative rounded-full before:absolute before:-inset-1.5 before:content-['']", foco)}
            >
              {avatar}
            </button>
          ) : (
            avatar
          )}
        </div>
      </header>
      {titulo && !recolhido ? (
        <div className="px-4 pt-3">
          <h1 className="font-display text-[26px] leading-tight font-semibold text-foreground">{titulo}</h1>
          {meta ? <div className="mt-0.5 text-sm font-medium text-muted-foreground">{meta}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detalhe: telas empilhadas                                           */
/* ------------------------------------------------------------------ */

type HeaderCentroProps = {
  titulo: React.ReactNode
  subtitulo?: React.ReactNode
  onVoltar?: () => void
  rotuloVoltar?: string
  /** No máximo uma ação: um `BotaoTopo` (compartilhar ou mais). */
  acao?: React.ReactNode
  className?: string
}

function TopoCentrado({
  titulo,
  subtitulo,
  onVoltar,
  rotuloVoltar = "Voltar",
  acao,
  className,
  imersivo,
}: HeaderCentroProps & { imersivo: boolean }) {
  return (
    <header className={cn("flex h-topbar items-center justify-between gap-3", className)}>
      <BotaoTopo tom={imersivo ? "imersivo" : "claro"} icone={icone("voltar")} rotulo={rotuloVoltar} onClick={onVoltar} />
      <div className="flex min-w-0 flex-col items-center text-center">
        <h1 className={cn("truncate font-display text-[17px] leading-tight font-semibold", imersivo ? "text-white" : "text-foreground")}>
          {titulo}
        </h1>
        {subtitulo ? (
          <p className={cn("mt-0.5 truncate text-xs leading-tight font-medium", imersivo ? "text-white/70" : "text-muted-foreground")}>
            {subtitulo}
          </p>
        ) : null}
      </div>
      {acao ?? <span aria-hidden="true" className="size-header-btn shrink-0" />}
    </header>
  )
}

function HeaderDetalhe({ className, ...props }: HeaderCentroProps) {
  return <TopoCentrado {...props} imersivo={false} className={cn("bg-surface px-4", className)} />
}

/* ------------------------------------------------------------------ */
/* Imersivo: dentro do bloco roxo                                      */
/* ------------------------------------------------------------------ */

function HeaderImersivo(props: HeaderCentroProps) {
  return <TopoCentrado {...props} imersivo />
}

type BlocoImersivoProps = React.ComponentProps<"section"> & {
  padrao?: NomePadrao
}

/** Bloco roxo de ponta a ponta que leva o `HeaderImersivo`; a `FolhaImersiva` sobe 24 px sobre ele. */
function BlocoImersivo({ padrao = "impulso", className, children, ...props }: BlocoImersivoProps) {
  return (
    <section
      data-slot="bloco-imersivo"
      className={cn("relative w-full overflow-hidden bg-hero px-4 pt-3 pb-16 text-white", className)}
      {...props}
    >
      <Padrao
        padrao={padrao}
        esmaecer={padrao === "impulso" ? "diagonal" : "canto"}
        posicao={padrao === "impulso" ? "-top-10 -right-[60px] size-[400px]" : undefined}
      />
      <div className="relative">{children}</div>
    </section>
  )
}

function FolhaImersiva({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="folha-imersiva"
      className={cn("relative -mt-6 flex flex-col gap-4 rounded-t-3xl bg-surface px-4 pt-5 pb-6", className)}
      {...props}
    />
  )
}

export { BotaoTopo, HeaderRaiz, HeaderDetalhe, HeaderImersivo, BlocoImersivo, FolhaImersiva }
export type { BotaoTopoProps, HeaderRaizProps, HeaderCentroProps as HeaderDetalheProps, BlocoImersivoProps }
