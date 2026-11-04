"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { mdiThemeLightDark, mdiWeatherNight, mdiWhiteBalanceSunny } from "@mdi/js"
import { Icon } from "@meujogo/ui/components/icon"
import { ToggleGroup, ToggleGroupItem } from "@meujogo/ui/components/ui/toggle-group"

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: mdiWhiteBalanceSunny },
  { value: "system", label: "Automático", icon: mdiThemeLightDark },
  { value: "dark", label: "Escuro", icon: mdiWeatherNight },
] as const

type ThemeSwitcherProps = Omit<
  React.ComponentProps<typeof ToggleGroup>,
  "value" | "defaultValue" | "onValueChange" | "children"
> & {
  /** Só o ícone, com o rótulo no nome acessível. */
  compact?: boolean
}

const subscribeToNothing = () => () => {}

/** Claro, automático ou escuro, via `next-themes`; pede um `ThemeProvider` acima. */
function ThemeSwitcher({ compact = false, variant = "outline", size = "sm", ...props }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()
  // O tema salvo só existe no navegador; lê-lo no servidor desencontraria a hidratação.
  const mounted = React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )
  const current = mounted ? (theme ?? "system") : undefined

  return (
    <ToggleGroup
      aria-label="Tema"
      variant={variant}
      size={size}
      {...props}
      value={current ? [current] : []}
      onValueChange={(values: string[]) => {
        if (values[0]) setTheme(values[0])
      }}
    >
      {THEME_OPTIONS.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} aria-label={compact ? option.label : undefined}>
          <Icon path={option.icon} />
          {compact ? null : option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { ThemeSwitcher, THEME_OPTIONS }
export type { ThemeSwitcherProps }
