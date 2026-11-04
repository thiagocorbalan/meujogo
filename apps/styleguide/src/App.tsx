import { Logo, Code } from "./sections/_shared"
import { Brand } from "./sections/Brand"
import { Patterns } from "./sections/Patterns"
import { Color } from "./sections/Color"
import { Typography } from "./sections/Typography"
import { Spacing } from "./sections/Spacing"
import { Icons } from "./sections/Icons"
import { Emblems } from "./sections/Emblems"
import { Components } from "./sections/Components"
import { ScreenPatterns } from "./sections/ScreenPatterns"
import { Motion } from "./sections/Motion"
import { A11y } from "./sections/A11y"
import { ThemeSwitcher } from "@meujogo/ui/components/mj/theme-switcher"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"
import symbolLogo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"
import primaryLogo from "@meujogo/brand/logo/meujogo-logo.svg?raw"

const NAV: [string, string][] = [
  ["brand", "Marca"],
  ["patterns", "Padrões"],
  ["color", "Cor"],
  ["typography", "Tipo"],
  ["spacing", "Espaço"],
  ["icons", "Ícones"],
  ["emblems", "Emblemas"],
  ["components", "Componentes"],
  ["screen-patterns", "Telas"],
  ["motion", "Movimento"],
  ["accessibility", "A11y"],
]

export function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-purple text-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5" aria-label="Meu Jogo, início">
            <Logo svg={symbolLogo} className="h-8" />
            <span className="font-display text-sm font-semibold text-white/90">Styleguide</span>
          </a>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex" aria-label="Seções">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <span className="flex-1 md:hidden" />
          <ThemeSwitcher
            compact
            spacing={0}
            className="rounded-full border border-white/25 bg-white/5 text-white *:rounded-full *:border-0 *:text-white *:hover:bg-white/10 *:data-pressed:bg-white *:data-pressed:text-purple *:aria-pressed:bg-white *:aria-pressed:text-purple"
          />
        </div>
      </header>

      <main id="top">
        <section className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col gap-5">
              <p className="font-num text-sm font-bold tracking-[0.12em] text-muted-foreground uppercase">Meu Jogo · Styleguide · v2</p>
              <h1 className="font-display text-4xl leading-[1.05] font-bold text-balance text-ink sm:text-6xl">Tudo o que uma tela da v2 usa.</h1>
              <p className="max-w-[60ch] text-lg leading-relaxed text-fg-2">
                Marca, cor, tipografia, ícones e componentes, em claro e escuro, construídos com shadcn/ui sobre os tokens da identidade. O roxo conduz e a cor viva tem papel fixo. É de onde o <Code>apps/web</Code> importa a interface.
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-fg-2">
                <span className="rounded-full border border-border bg-card px-3 py-1">shadcn/ui 4 · Base UI</span>
                <span className="rounded-full border border-border bg-card px-3 py-1">Tailwind 4</span>
                <span className="rounded-full border border-border bg-card px-3 py-1">Material Design Icons</span>
                <span className="rounded-full border border-border bg-card px-3 py-1">Lexend · Manrope · Rajdhani</span>
              </div>
            </div>
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gold p-8 text-purple">
              <Logo svg={primaryLogo} className="h-16 w-auto sm:h-20" />
            </div>
          </div>
        </section>

        <Brand />
        <Patterns />
        <Color />
        <Typography />
        <Spacing />
        <Icons />
        <Emblems />
        <Components />
        <ScreenPatterns />
        <Motion />
        <A11y />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-fg-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo svg={primaryLogo} className="h-12 text-ink" />
          <p className="max-w-[60ch]">
            Componentes em <Code>packages/ui</Code>, arquivos da marca em <Code>packages/brand</Code>, esta vitrine em <Code>apps/styleguide</Code>. <Code>pnpm --filter @meujogo/styleguide dev</Code> para editar.
          </p>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Icon path={iconPath("season")} className="size-4" /> v3.2
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App
