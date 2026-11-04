import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { iconPath } from "@meujogo/ui/icons"

type VestColor = "yellow" | "red" | "black" | "blue" | "white"

const COLORS: Record<VestColor, string> = {
  yellow: "text-vest-yellow",
  red: "text-vest-red",
  black: "text-vest-black",
  blue: "text-vest-blue",
  white: "text-vest-white",
}

const NAMES: Record<VestColor, string> = {
  yellow: "Amarelo",
  red: "Vermelho",
  black: "Preto",
  blue: "Azul",
  white: "Branco",
}

const SIZES = {
  sm: "size-4",
  md: "size-[18px]",
  lg: "size-5",
  scoreboard: "size-[52px]",
} as const

type VestProps = Omit<React.ComponentProps<"svg">, "children" | "color"> & {
  color: VestColor
  size?: keyof typeof SIZES
  /**
   * Fio de contorno para o colete não sumir no fundo. Por padrão só o branco tem,
   * e o preto ganha um no tema escuro; passe `false` sobre o roxo.
   */
  outline?: boolean
  /** Nome acessível. Sem ele o colete é decorativo: ele sempre vem ao lado do nome do time. */
  label?: string
}

function Vest({ color, size = "md", outline, label, className, ...props }: VestProps) {
  const hasOutline = outline ?? color === "white"
  return (
    <svg
      viewBox="0 0 24 24"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-slot="vest"
      data-color={color}
      className={cn("shrink-0", SIZES[size], className)}
      {...props}
    >
      <path d={iconPath("vest")} fill="currentColor" className={COLORS[color]} />
      {hasOutline ? <path d={iconPath("vest-outline")} fill="currentColor" className="text-muted-foreground/70" /> : null}
      {outline === undefined && color === "black" ? (
        <path d={iconPath("vest-outline")} fill="currentColor" className="hidden text-white/60 dark:block" />
      ) : null}
    </svg>
  )
}

export { Vest, NAMES as VEST_NAMES }
export type { VestProps, VestColor }
