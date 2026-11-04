import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"
import { BrandMark } from "@meujogo/ui/components/mj/brand-mark"
import { BrandPattern, type PatternName } from "@meujogo/ui/components/mj/brand-pattern"

const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-ring"

/* ------------------------------------------------------------------ */
/* Botão redondo do topo                                               */
/* ------------------------------------------------------------------ */

type HeaderButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  /** Path MDI (ver `iconPath()` em `@meujogo/ui/icons`). */
  icon: string
  label: string
  /** `light` no topo branco, `immersive` sobre o roxo, `bare` sem fundo (sino). */
  tone?: "light" | "immersive" | "bare"
  children?: React.ReactNode
}

const BUTTON_TONES = {
  light: "bg-tint-10 text-ink hover:bg-tint-6",
  immersive: "bg-on-hero-14 text-white hover:bg-white/20",
  bare: "text-fg-2 hover:bg-tint-6",
} as const

/** 40 px visíveis, 44 px de área de toque. */
function HeaderButton({ icon: path, label, tone = "light", className, children, type = "button", ...props }: HeaderButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      data-slot="header-button"
      className={cn(
        "relative inline-flex size-header-btn shrink-0 items-center justify-center rounded-full transition-colors duration-150 before:absolute before:-inset-0.5 before:content-['']",
        BUTTON_TONES[tone],
        focusRing,
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

type RootHeaderProps = {
  group: string
  /** `primary` só no Início; nas outras abas, o símbolo. */
  brand?: "symbol" | "primary"
  onSwitchGroup?: () => void
  notifications?: number
  onNotifications?: () => void
  /** Normalmente um `PlayerAvatar` de 32 px. */
  avatar: React.ReactNode
  onProfile?: () => void
  title?: React.ReactNode
  meta?: React.ReactNode
  /** Na rolagem o título grande sai e a linha de cima ganha hairline. */
  collapsed?: boolean
  className?: string
}

function RootHeader({
  group,
  brand = "symbol",
  onSwitchGroup,
  notifications = 0,
  onNotifications,
  avatar,
  onProfile,
  title,
  meta,
  collapsed = false,
  className,
}: RootHeaderProps) {
  const primary = brand === "primary"
  const count = notifications > 9 ? "9+" : String(notifications)

  return (
    <div data-slot="root-header" className={className}>
      <header
        className={cn(
          "flex h-topbar items-center justify-between gap-2 bg-surface px-4",
          collapsed && "border-b border-line"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {primary ? (
            <>
              <BrandMark variant="primary" className="h-[26px] text-ink" />
              <span aria-hidden="true" className="h-6 w-px shrink-0 bg-line" />
            </>
          ) : null}
          <button
            type="button"
            onClick={onSwitchGroup}
            aria-label={`Trocar de grupo, ${group}`}
            className={cn(
              "relative flex h-header-btn min-w-0 items-center rounded-full text-ink before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-['']",
              primary ? "gap-0.5 pr-1 font-body text-sm font-semibold" : "-ml-1 gap-2 pr-2 pl-1 font-display text-base font-semibold",
              focusRing
            )}
          >
            {primary ? null : <BrandMark variant="symbol" label="" className="h-7" />}
            <span className="truncate">{group}</span>
            <Icon path={iconPath("expand")} className={primary ? "size-[18px]" : "size-5"} />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <HeaderButton
            tone="bare"
            icon={iconPath("notification-outline")}
            label={notifications > 0 ? `Notificações, ${notifications} novas` : "Notificações"}
            onClick={onNotifications}
          >
            {notifications > 0 ? (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple px-1 font-num text-[11px] leading-none font-bold text-white dark:bg-lavender dark:text-purple"
              >
                {count}
              </span>
            ) : null}
          </HeaderButton>
          {onProfile ? (
            <button
              type="button"
              onClick={onProfile}
              aria-label="Perfil"
              className={cn("relative rounded-full before:absolute before:-inset-1.5 before:content-['']", focusRing)}
            >
              {avatar}
            </button>
          ) : (
            avatar
          )}
        </div>
      </header>
      {title && !collapsed ? (
        <div className="px-4 pt-3">
          <h1 className="font-display text-[26px] leading-tight font-semibold text-foreground">{title}</h1>
          {meta ? <div className="mt-0.5 text-sm font-medium text-muted-foreground">{meta}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detalhe: telas empilhadas                                           */
/* ------------------------------------------------------------------ */

type CenteredHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onBack?: () => void
  backLabel?: string
  /** No máximo uma ação: um `HeaderButton` (compartilhar ou mais). */
  action?: React.ReactNode
  className?: string
}

function CenteredHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Voltar",
  action,
  className,
  immersive,
}: CenteredHeaderProps & { immersive: boolean }) {
  return (
    <header className={cn("flex h-topbar items-center justify-between gap-3", className)}>
      <HeaderButton tone={immersive ? "immersive" : "light"} icon={iconPath("back")} label={backLabel} onClick={onBack} />
      <div className="flex min-w-0 flex-col items-center text-center">
        <h1 className={cn("truncate font-display text-[17px] leading-tight font-semibold", immersive ? "text-white" : "text-foreground")}>
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("mt-0.5 truncate text-xs leading-tight font-medium", immersive ? "text-white/70" : "text-muted-foreground")}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ?? <span aria-hidden="true" className="size-header-btn shrink-0" />}
    </header>
  )
}

function DetailHeader({ className, ...props }: CenteredHeaderProps) {
  return <CenteredHeader {...props} immersive={false} className={cn("bg-surface px-4", className)} />
}

/* ------------------------------------------------------------------ */
/* Imersivo: dentro do bloco roxo                                      */
/* ------------------------------------------------------------------ */

function ImmersiveHeader(props: CenteredHeaderProps) {
  return <CenteredHeader {...props} immersive />
}

type ImmersiveBlockProps = React.ComponentProps<"section"> & {
  pattern?: PatternName
}

/** Bloco roxo de ponta a ponta que leva o `ImmersiveHeader`; a `ImmersiveSheet` sobe 24 px sobre ele. */
function ImmersiveBlock({ pattern = "impulse", className, children, ...props }: ImmersiveBlockProps) {
  return (
    <section
      data-slot="immersive-block"
      className={cn("relative w-full overflow-hidden bg-hero px-4 pt-3 pb-16 text-white", className)}
      {...props}
    >
      <BrandPattern
        pattern={pattern}
        fade={pattern === "impulse" ? "diagonal" : "corner"}
        position={pattern === "impulse" ? "-top-10 -right-[60px] size-[400px]" : undefined}
      />
      <div className="relative">{children}</div>
    </section>
  )
}

function ImmersiveSheet({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="immersive-sheet"
      className={cn("relative -mt-6 flex flex-col gap-4 rounded-t-3xl bg-surface px-4 pt-5 pb-6", className)}
      {...props}
    />
  )
}

export { HeaderButton, RootHeader, DetailHeader, ImmersiveHeader, ImmersiveBlock, ImmersiveSheet }
export type { HeaderButtonProps, RootHeaderProps, CenteredHeaderProps as DetailHeaderProps, ImmersiveBlockProps }
