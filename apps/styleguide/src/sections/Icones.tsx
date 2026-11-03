import { Section, Bloco, Demo, Linha, Code } from "./_shared"
import { Icon } from "@meujogo/ui/components/icon"
import { ICONES, FAMILIAS, icone, type Familia } from "@meujogo/ui/icones"
import { Badge } from "@meujogo/ui/components/ui/badge"
import { Button } from "@meujogo/ui/components/ui/button"

const ORDEM: Familia[] = ["navegacao", "dia-de-jogo", "pos-jogo", "sistema", "interface"]

export function Icones() {
  const provisorios = ICONES.filter((i) => i.provisorio)
  return (
    <Section
      id="icones"
      n="06 · Ícones"
      titulo="Material Design Icons, do Pictogrammers."
      lead={
        <>
          O conjunto da interface é o <a className="font-semibold text-ink underline underline-offset-4" href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noreferrer">Material Design Icons</a> (MDI), um ícone por função, em <Code>currentColor</Code>. A gramática do símbolo (15°, 60°, 75° e o corte) fica para o logo e os padrões; os ícones são de mercado e não se redesenham. No código: <Code>@mdi/js</Code> com o componente <Code>Icon</Code>.
        </>
      }
    >
      {ORDEM.map((f) => (
        <Bloco key={f} titulo={FAMILIAS[f]}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {ICONES.filter((i) => i.familia === f).map((i) => (
              <div key={i.nome} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-ink">
                  <Icon path={i.path} className="size-6" />
                  {i.provisorio ? <span aria-hidden="true" className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warning ring-2 ring-card" /> : null}
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <b className="truncate text-sm text-ink">{i.nome}</b>
                  <code className="truncate font-num text-xs font-semibold text-muted-foreground">{i.mdi}</code>
                </span>
              </div>
            ))}
          </div>
        </Bloco>
      ))}

      <Bloco titulo="Os de futebol que faltam" nota="O MDI tem bola, campo, apito e chuteira, mas não tem trave, luva de goleiro nem pênalti. O Thiago busca alternativas; até lá, os três abaixo são provisórios (ponto ouro no grid).">
        <ul className="grid gap-2 sm:grid-cols-3">
          {provisorios.map((i) => (
            <li key={i.nome} className="flex items-start gap-3 rounded-lg border border-warning/60 bg-card p-3">
              <Icon path={i.path} className="size-6 shrink-0 text-ink" />
              <span className="flex flex-col text-sm leading-snug">
                <b className="text-ink">{i.nome}</b>
                <span className="text-fg-2">{i.provisorio}</span>
              </span>
            </li>
          ))}
        </ul>
      </Bloco>

      <Bloco titulo="Em tela" nota="Tamanhos 16, 20, 24 e 32 px. Sozinho, o ícone leva aria-label; com texto, é aria-hidden. Nos botões, 20 px; na navegação inferior, 24 px; em estado vazio e dialog de confirmação, 32 px.">
        <Demo>
          <Linha className="text-ink">
            <Icon path={icone("jogos")} className="size-4" />
            <Icon path={icone("jogos")} className="size-5" />
            <Icon path={icone("jogos")} className="size-6" />
            <Icon path={icone("jogos")} className="size-8" />
            <span className="mx-2 h-6 w-px bg-border" />
            <Badge variant="success">
              <Icon path={icone("presenca")} /> Confirmado
            </Badge>
            <Button size="sm" variant="outline">
              <Icon path={icone("compartilhar")} /> Compartilhar
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Mais ações">
              <Icon path={icone("mais")} />
            </Button>
          </Linha>
          <div className="flex items-center gap-5 rounded-xl border-t border-line bg-surface px-4 py-3">
            <span className="flex h-8 items-center rounded-full bg-tint-10 px-4 text-roxo dark:text-lavanda">
              <Icon path={icone("jogos")} className="size-6" />
            </span>
            <Icon path={icone("ranking")} className="size-6 text-muted-foreground" />
            <Icon path={icone("grupo")} className="size-6 text-muted-foreground" />
            <Icon path={icone("perfil")} className="size-6 text-muted-foreground" />
            <span className="ml-auto text-xs text-muted-foreground">Ativo em roxo sobre pílula roxo 10%, inativos em muted</span>
          </div>
        </Demo>
      </Bloco>
    </Section>
  )
}
