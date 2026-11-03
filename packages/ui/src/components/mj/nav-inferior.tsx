import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"

type ItemNav = {
  id: string
  rotulo: string
  /** Ícone cheio do item ativo. */
  icone: string
  /** Ícone de contorno do item inativo. */
  iconeInativo: string
  href?: string
}

const ITENS_NAV: ItemNav[] = [
  { id: "inicio", rotulo: "Início", icone: icone("inicio"), iconeInativo: icone("inicio-contorno") },
  { id: "jogo", rotulo: "Jogo", icone: icone("quadra"), iconeInativo: icone("quadra") },
  { id: "ranking", rotulo: "Ranking", icone: icone("trofeu"), iconeInativo: icone("trofeu-contorno") },
  { id: "grupo", rotulo: "Grupo", icone: icone("grupo"), iconeInativo: icone("grupo-contorno") },
  { id: "perfil", rotulo: "Perfil", icone: icone("conta"), iconeInativo: icone("conta-contorno") },
]

type NavInferiorProps = Omit<React.ComponentProps<"nav">, "children"> & {
  ativo: string
  itens?: ItemNav[]
  onSelecionar?: (id: string) => void
  /** Presa ao rodapé da janela. Sem isso, fica no fluxo (útil em prévias). */
  fixa?: boolean
}

function NavInferior({ ativo, itens = ITENS_NAV, onSelecionar, fixa = false, className, ...props }: NavInferiorProps) {
  return (
    <nav
      aria-label="Navegação principal"
      data-slot="nav-inferior"
      className={cn(
        "w-full border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)]",
        fixa && "fixed inset-x-0 bottom-0 z-40",
        className
      )}
      {...props}
    >
      <ul className="flex h-bottomnav items-center justify-around">
        {itens.map((item) => {
          const atual = item.id === ativo
          const conteudo = (
            <>
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                  atual && "bg-tint-10"
                )}
              >
                <Icon path={atual ? item.icone : item.iconeInativo} className="size-6" />
              </span>
              <span className="text-[11px] leading-tight font-semibold">{item.rotulo}</span>
            </>
          )
          const classe = cn(
            "flex h-full min-w-11 flex-col items-center justify-center gap-1 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring",
            atual ? "text-ink" : "text-muted-foreground hover:text-fg-2"
          )
          return (
            <li key={item.id} className="flex h-full flex-1 justify-center">
              {item.href ? (
                <a
                  href={item.href}
                  aria-current={atual ? "page" : undefined}
                  onClick={onSelecionar ? () => onSelecionar(item.id) : undefined}
                  className={cn(classe, "w-full")}
                >
                  {conteudo}
                </a>
              ) : (
                <button
                  type="button"
                  aria-current={atual ? "page" : undefined}
                  onClick={() => onSelecionar?.(item.id)}
                  className={cn(classe, "w-full")}
                >
                  {conteudo}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { NavInferior, ITENS_NAV }
export type { NavInferiorProps, ItemNav }
