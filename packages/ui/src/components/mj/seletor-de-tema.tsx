"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { mdiThemeLightDark, mdiWeatherNight, mdiWhiteBalanceSunny } from "@mdi/js"
import { Icon } from "@meujogo/ui/components/icon"
import { ToggleGroup, ToggleGroupItem } from "@meujogo/ui/components/ui/toggle-group"

const OPCOES_TEMA = [
  { valor: "light", rotulo: "Claro", icone: mdiWhiteBalanceSunny },
  { valor: "system", rotulo: "Automático", icone: mdiThemeLightDark },
  { valor: "dark", rotulo: "Escuro", icone: mdiWeatherNight },
] as const

type SeletorDeTemaProps = Omit<
  React.ComponentProps<typeof ToggleGroup>,
  "value" | "defaultValue" | "onValueChange" | "children"
> & {
  /** Só o ícone, com o rótulo no nome acessível. */
  compacto?: boolean
}

const nadaAssinar = () => () => {}

/** Claro, automático ou escuro, via `next-themes`; pede um `ThemeProvider` acima. */
function SeletorDeTema({ compacto = false, variant = "outline", size = "sm", ...props }: SeletorDeTemaProps) {
  const { theme, setTheme } = useTheme()
  // O tema salvo só existe no navegador; lê-lo no servidor desencontraria a hidratação.
  const montado = React.useSyncExternalStore(
    nadaAssinar,
    () => true,
    () => false
  )
  const atual = montado ? (theme ?? "system") : undefined

  return (
    <ToggleGroup
      aria-label="Tema"
      variant={variant}
      size={size}
      {...props}
      value={atual ? [atual] : []}
      onValueChange={(valores: string[]) => {
        if (valores[0]) setTheme(valores[0])
      }}
    >
      {OPCOES_TEMA.map((opcao) => (
        <ToggleGroupItem key={opcao.valor} value={opcao.valor} aria-label={compacto ? opcao.rotulo : undefined}>
          <Icon path={opcao.icone} />
          {compacto ? null : opcao.rotulo}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { SeletorDeTema, OPCOES_TEMA }
export type { SeletorDeTemaProps }
