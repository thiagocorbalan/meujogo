import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"

export function Section({
  id,
  n,
  titulo,
  lead,
  children,
  className,
}: {
  id: string
  n: string
  titulo: string
  lead?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("scroll-mt-16 border-t border-border py-14 sm:py-16", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="font-num text-sm font-bold tracking-[0.12em] text-muted-foreground uppercase">{n}</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-balance text-ink sm:text-4xl">{titulo}</h2>
        {lead ? <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-fg-2">{lead}</p> : null}
        <div className="mt-8 flex flex-col gap-12">{children}</div>
      </div>
    </section>
  )
}

export function Bloco({
  titulo,
  nota,
  children,
  id,
}: {
  titulo: string
  nota?: React.ReactNode
  children: React.ReactNode
  id?: string
}) {
  return (
    <div id={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-semibold text-ink">{titulo}</h3>
        {nota ? <p className="max-w-[70ch] text-sm leading-relaxed text-fg-2">{nota}</p> : null}
      </div>
      {children}
    </div>
  )
}

function Pane({ tema, label, children }: { tema: "light" | "dark"; label: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        tema,
        "relative flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-5 pt-9 text-foreground"
      )}
    >
      <span className="absolute top-3 left-5 font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

export function Demo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <Pane tema="light" label="Claro">
        {children}
      </Pane>
      <Pane tema="dark" label="Escuro">
        {children}
      </Pane>
    </div>
  )
}

export function Linha({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>
}

export function Sw({
  nome,
  hex,
  nota,
  texto,
}: {
  nome: string
  hex: string
  nota?: string
  texto?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        className="flex h-20 items-end rounded-lg border border-border/60 p-2 font-display text-sm font-semibold"
        style={{ background: hex, color: texto ?? "transparent" }}
      >
        {texto ? "Aa" : ""}
      </div>
      <div className="flex flex-col">
        <b className="text-sm text-ink">{nome}</b>
        <code className="font-num text-sm font-semibold text-fg-2">{hex}</code>
        {nota ? <span className="text-xs leading-snug text-muted-foreground">{nota}</span> : null}
      </div>
    </div>
  )
}

export function Sw2({ nome, claro, escuro, nota }: { nome: string; claro: string; escuro: string; nota?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex h-20 overflow-hidden rounded-lg border border-border/60">
        <span className="flex-1" style={{ background: claro }} />
        <span className="flex-1" style={{ background: escuro }} />
      </div>
      <div className="flex flex-col">
        <b className="text-sm text-ink">{nome}</b>
        <code className="font-num text-sm font-semibold text-fg-2">
          {claro} · {escuro}
        </code>
        {nota ? <span className="text-xs leading-snug text-muted-foreground">{nota}</span> : null}
      </div>
    </div>
  )
}

export function Logo({ svg, className, style }: { svg: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={cn("inline-block leading-none [&>svg]:h-full [&>svg]:w-auto", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-md bg-muted px-1.5 py-0.5 font-num text-[0.95em] font-semibold text-ink">{children}</code>
}

export function Nunca({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm leading-snug text-fg-2">
      <span aria-hidden="true" className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-error" />
      <span>{children}</span>
    </li>
  )
}
