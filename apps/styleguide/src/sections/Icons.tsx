import { Section, Block, Demo, Row, Code } from "./_shared"
import { Icon } from "@meujogo/ui/components/icon"
import { ICONS, ICON_FAMILIES, iconPath, type IconFamily } from "@meujogo/ui/icons"
import { Badge } from "@meujogo/ui/components/ui/badge"
import { Button } from "@meujogo/ui/components/ui/button"

const ORDER: IconFamily[] = ["navigation", "match-day", "post-match", "system", "interface"]

export function Icons() {
  return (
    <Section
      id="icons"
      n="06 · Ícones"
      title="Material Design Icons, do Pictogrammers."
      lead={
        <>
          O conjunto da interface é o <a className="font-semibold text-ink underline underline-offset-4" href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noreferrer">Material Design Icons</a> (MDI), um ícone por função, em <Code>currentColor</Code>. A gramática do símbolo (15°, 60°, 75° e o corte) fica para o logo e os padrões; os ícones são de mercado e não se redesenham. No código: <Code>@mdi/js</Code> com o componente <Code>Icon</Code>.
        </>
      }
    >
      {ORDER.map((f) => (
        <Block key={f} title={ICON_FAMILIES[f]}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {ICONS.filter((i) => i.family === f).map((i) => (
              <div key={i.name} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-ink">
                  <Icon path={i.path} className="size-6" />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <b className="truncate text-sm text-ink">{i.name}</b>
                  <code className="truncate font-num text-xs font-semibold text-muted-foreground">{i.mdi}</code>
                </span>
              </div>
            ))}
          </div>
        </Block>
      ))}

      <Block title="Em tela" note="Tamanhos 16, 20, 24 e 32 px. Sozinho, o ícone leva aria-label; com texto, é aria-hidden. Nos botões, 20 px; na navegação inferior, 24 px; em estado vazio e dialog de confirmação, 32 px.">
        <Demo>
          <Row className="text-ink">
            <Icon path={iconPath("games")} className="size-4" />
            <Icon path={iconPath("games")} className="size-5" />
            <Icon path={iconPath("games")} className="size-6" />
            <Icon path={iconPath("games")} className="size-8" />
            <span className="mx-2 h-6 w-px bg-border" />
            <Badge variant="success">
              <Icon path={iconPath("attendance")} /> Confirmado
            </Badge>
            <Button size="sm" variant="outline">
              <Icon path={iconPath("share")} /> Compartilhar
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Mais ações">
              <Icon path={iconPath("more")} />
            </Button>
          </Row>
          <div className="flex items-center gap-5 rounded-xl border-t border-line bg-surface px-4 py-3">
            <span className="flex h-8 items-center rounded-full bg-tint-10 px-4 text-purple dark:text-lavender">
              <Icon path={iconPath("games")} className="size-6" />
            </span>
            <Icon path={iconPath("ranking")} className="size-6 text-muted-foreground" />
            <Icon path={iconPath("group")} className="size-6 text-muted-foreground" />
            <Icon path={iconPath("profile")} className="size-6 text-muted-foreground" />
            <span className="ml-auto text-xs text-muted-foreground">Ativo em roxo sobre pílula roxo 10%, inativos em muted</span>
          </div>
        </Demo>
      </Block>
    </Section>
  )
}
