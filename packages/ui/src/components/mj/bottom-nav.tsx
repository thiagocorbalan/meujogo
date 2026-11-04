import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"

type NavItem = {
  id: string
  label: string
  /** Ícone cheio do item ativo. */
  icon: string
  /** Ícone de contorno do item inativo. */
  inactiveIcon: string
  href?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Início", icon: iconPath("home"), inactiveIcon: iconPath("home-outline") },
  { id: "game", label: "Jogo", icon: iconPath("court"), inactiveIcon: iconPath("court") },
  { id: "ranking", label: "Ranking", icon: iconPath("trophy"), inactiveIcon: iconPath("trophy-outline") },
  { id: "group", label: "Grupo", icon: iconPath("group"), inactiveIcon: iconPath("group-outline") },
  { id: "profile", label: "Perfil", icon: iconPath("account"), inactiveIcon: iconPath("account-outline") },
]

type BottomNavProps = Omit<React.ComponentProps<"nav">, "children" | "onSelect"> & {
  active: string
  items?: NavItem[]
  onSelect?: (id: string) => void
  /** Presa ao rodapé da janela. Sem isso, fica no fluxo (útil em prévias). */
  fixed?: boolean
}

function BottomNav({ active, items = NAV_ITEMS, onSelect, fixed = false, className, ...props }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      data-slot="bottom-nav"
      className={cn(
        "w-full border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)]",
        fixed && "fixed inset-x-0 bottom-0 z-40",
        className
      )}
      {...props}
    >
      <ul className="flex h-bottomnav items-center justify-around">
        {items.map((item) => {
          const current = item.id === active
          const content = (
            <>
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                  current && "bg-tint-10"
                )}
              >
                <Icon path={current ? item.icon : item.inactiveIcon} className="size-6" />
              </span>
              <span className="text-[11px] leading-tight font-semibold">{item.label}</span>
            </>
          )
          const itemClass = cn(
            "flex h-full min-w-11 flex-col items-center justify-center gap-1 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring",
            current ? "text-ink" : "text-muted-foreground hover:text-fg-2"
          )
          return (
            <li key={item.id} className="flex h-full flex-1 justify-center">
              {item.href ? (
                <a
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={onSelect ? () => onSelect(item.id) : undefined}
                  className={cn(itemClass, "w-full")}
                >
                  {content}
                </a>
              ) : (
                <button
                  type="button"
                  aria-current={current ? "page" : undefined}
                  onClick={() => onSelect?.(item.id)}
                  className={cn(itemClass, "w-full")}
                >
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { BottomNav, NAV_ITEMS }
export type { BottomNavProps, NavItem }
