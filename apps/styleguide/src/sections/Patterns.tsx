import { cn } from "@meujogo/ui/lib/utils"
import { Section, Block, Logo, Code } from "./_shared"
import primaryLogo from "@meujogo/brand/logo/meujogo-logo.svg?raw"
import symbolLogo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"
import impulseSvg from "@meujogo/brand/padroes/padrao-impulso.svg?raw"
import rhythmSvg from "@meujogo/brand/padroes/padrao-ritmo.svg?raw"
import energySvg from "@meujogo/brand/padroes/padrao-energia.svg?raw"
import quarteredSvg from "@meujogo/brand/padroes/padrao-aquartelado.svg?raw"
import impulseTileSvg from "@meujogo/brand/padroes/padrao-impulso-tile.svg?raw"
import energyTileSvg from "@meujogo/brand/padroes/padrao-energia-tile.svg?raw"

type Pattern = {
  name: string
  svg: string
  source: string
  construction: string
  background: string
  ink: string
  use: string
  avoid: string
  mark: "primary-white" | "primary-purple" | "symbol-purple"
}

const PATTERNS: Record<string, Pattern> = {
  impulse: {
    name: "Impulso",
    svg: impulseSvg,
    source: "o ângulo dos braços, 15°",
    construction: "barras cortadas em paralelo, cinco comprimentos e três larguras, densas nas bordas e vazias no centro",
    background: "roxo",
    ink: "rosa e ciano, marca em branco",
    use: "capa, story, abertura de tela, hero",
    avoid: "atrás de texto corrido",
    mark: "primary-white",
  },
  rhythm: {
    name: "Ritmo",
    svg: rhythmSvg,
    source: "a passada, 60°",
    construction: "faixas paralelas em três larguras que se repetem como um compasso; uma faixa a 15° cruza",
    background: "ciano",
    ink: "roxo e rosa, marca em roxo",
    use: "partida ao vivo, placar, transição, camisa",
    avoid: "tamanhos pequenos: as faixas viram listra",
    mark: "symbol-purple",
  },
  energy: {
    name: "Energia",
    svg: energySvg,
    source: "a passada nos dois sentidos, 60° e 240°",
    construction: "setas com haste e cabeça, sem se sobrepor, centro vazio",
    background: "rosa",
    ink: "roxo e ouro, marca em branco",
    use: "gol, campeão, celebração, convite",
    avoid: "fundo de dados",
    mark: "primary-white",
  },
  quartered: {
    name: "Aquartelado",
    svg: quarteredSvg,
    source: "a perna de apoio e o braço, 75° e 15°",
    construction: "leques de sete raios por canto, a 9° um do outro, encurtando e afinando até o centro",
    background: "ouro",
    ink: "roxo e ciano, marca em roxo",
    use: "ranking, carta ouro, troféu, pódio",
    avoid: "header e rodapé: pede altura",
    mark: "primary-purple",
  },
}

function slice(svg: string) {
  return svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')
}

function Tile({ p, className, band }: { p: Pattern; className?: string; band?: boolean }) {
  return (
    <figure className={cn("group flex min-w-0 flex-col gap-3", className)}>
      <div className={cn("relative isolate overflow-hidden rounded-2xl", band ? "aspect-[16/5]" : "aspect-video")}>
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: band ? slice(p.svg) : p.svg }}
        />
        {p.mark === "symbol-purple" ? (
          <Logo svg={symbolLogo} className="absolute top-[7%] left-[7%] h-[34%] text-purple" />
        ) : (
          <Logo
            svg={primaryLogo}
            className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", band ? "h-[44%]" : "h-[26%]", p.mark === "primary-purple" ? "text-purple" : "text-white")}
          />
        )}
      </div>
      <figcaption className="grid gap-x-6 gap-y-1 text-sm leading-snug sm:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-1">
          <b className="font-display text-base font-semibold text-ink">
            {p.name} <span className="font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">· sobre {p.background}</span>
          </b>
          <span className="text-fg-2">
            Vem de <b className="font-semibold text-ink">{p.source}</b>: {p.construction}. {p.ink}.
          </span>
        </div>
        <div className="flex flex-col gap-1 text-fg-2">
          <span>
            <b className="font-semibold text-success-ink">Usar em</b> {p.use}
          </span>
          <span>
            <b className="font-semibold text-error-ink">Não usar</b> {p.avoid}
          </span>
        </div>
      </figcaption>
    </figure>
  )
}

function Module({ svg, name, size, color }: { svg: string; name: string; size: number; color: string }) {
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div className="aspect-[3/1] rounded-2xl" style={{ backgroundImage: url, backgroundSize: `${size}px ${size}px`, backgroundColor: color }} aria-hidden="true" />
      <figcaption className="text-sm text-fg-2">
        <b className="font-display font-semibold text-ink">{name}</b> · módulo de 400 × 400 repetido a {size} px
      </figcaption>
    </figure>
  )
}

export function Patterns() {
  return (
    <Section
      id="patterns"
      n="02 · Padrões"
      title="Os ângulos da silhueta, em escala de fundo."
      lead="Os quatro padrões vêm do que a silhueta já tem: os ângulos, o corte e a bola. Nenhum é textura decorativa. A marca mora no campo vazio, nunca sobre as barras; o texto fica no campo liso e o padrão entra por máscara num lado só. Nunca mudam de cor fora da paleta e nunca levam degradê."
    >
      <div className="grid gap-x-4 gap-y-8 lg:grid-cols-3">
        <Tile p={PATTERNS.impulse} className="lg:col-span-2 lg:row-span-2" />
        <Tile p={PATTERNS.rhythm} />
        <Tile p={PATTERNS.energy} />
        <Tile p={PATTERNS.quartered} className="lg:col-span-3" band />
      </div>

      <Block title="Módulos repetíveis" note="Impulso e energia existem também como módulo de 400 × 400 sem emenda, para fundo de qualquer tamanho, camisa e adesivo. O módulo se usa de 200 a 800 px de lado; abaixo disso as barras viram ruído. Para fundo de carregamento, o módulo desliza ao longo do próprio ângulo (seção Movimento).">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Module svg={impulseTileSvg} name="Impulso" size={240} color="#2E0B57" />
          <Module svg={energyTileSvg} name="Energia" size={200} color="#FF3D8A" />
        </div>
      </Block>

      <Block title="Regras" note="As composições 16:9 e os módulos estão em marca/padroes/, com as versões aplicadas (a marca já no lugar) e os PNG.">
        <ul className="grid gap-2 text-sm leading-snug text-fg-2 sm:grid-cols-2">
          <li className="rounded-xl border border-border bg-card p-4">
            <b className="font-display text-base font-semibold text-ink">No campo vazio</b>
            <p>A principal em branco sobre impulso e energia, em roxo sobre aquartelado; sobre ritmo, só o símbolo, no canto calmo. Área de proteção de um diâmetro de bola até a primeira barra.</p>
          </li>
          <li className="rounded-xl border border-border bg-card p-4">
            <b className="font-display text-base font-semibold text-ink">Story e social</b>
            <p>Em 9:16, recortar a composição pelo centro. Ranking atualizado usa aquartelado, gol usa energia, partida ao vivo usa ritmo, convite usa impulso.</p>
          </li>
          <li className="rounded-xl border border-border bg-card p-4">
            <b className="font-display text-base font-semibold text-ink">Em tela</b>
            <p>O padrão entra por máscara num lado só da faixa, para texto e botões ficarem no campo liso. Nunca atrás de texto corrido, nunca em tabela.</p>
          </li>
          <li className="rounded-xl border border-border bg-card p-4">
            <b className="font-display text-base font-semibold text-ink">Uma cor</b>
            <p>Em impressão de uma cor, os padrões viram roxo sobre branco com as barras a 40%: ouro e ciano não se distinguem em cinza.</p>
          </li>
        </ul>
        <p className="text-sm text-fg-2">
          Origem, medidas e geradores em <Code>docs/meujogo/marca/sistema-de-identidade.md</Code> §8.
        </p>
      </Block>
    </Section>
  )
}
