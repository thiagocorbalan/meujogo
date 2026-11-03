import { cn } from "@meujogo/ui/lib/utils"
import { Section, Bloco, Logo, Code } from "./_shared"
import principal from "@meujogo/brand/logo/meujogo-logo.svg?raw"
import simbolo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"
import impulso from "@meujogo/brand/padroes/padrao-impulso.svg?raw"
import ritmo from "@meujogo/brand/padroes/padrao-ritmo.svg?raw"
import energia from "@meujogo/brand/padroes/padrao-energia.svg?raw"
import aquartelado from "@meujogo/brand/padroes/padrao-aquartelado.svg?raw"
import impulsoTile from "@meujogo/brand/padroes/padrao-impulso-tile.svg?raw"
import energiaTile from "@meujogo/brand/padroes/padrao-energia-tile.svg?raw"

type Padrao = {
  nome: string
  svg: string
  fonte: string
  construcao: string
  fundo: string
  tinta: string
  usar: string
  evitar: string
  marca: "principal-branca" | "principal-roxa" | "simbolo-roxo"
}

const PADROES: Record<string, Padrao> = {
  impulso: {
    nome: "Impulso",
    svg: impulso,
    fonte: "o ângulo dos braços, 15°",
    construcao: "barras cortadas em paralelo, cinco comprimentos e três larguras, densas nas bordas e vazias no centro",
    fundo: "roxo",
    tinta: "rosa e ciano, marca em branco",
    usar: "capa, story, abertura de tela, hero",
    evitar: "atrás de texto corrido",
    marca: "principal-branca",
  },
  ritmo: {
    nome: "Ritmo",
    svg: ritmo,
    fonte: "a passada, 60°",
    construcao: "faixas paralelas em três larguras que se repetem como um compasso; uma faixa a 15° cruza",
    fundo: "ciano",
    tinta: "roxo e rosa, marca em roxo",
    usar: "partida ao vivo, placar, transição, camisa",
    evitar: "tamanhos pequenos: as faixas viram listra",
    marca: "simbolo-roxo",
  },
  energia: {
    nome: "Energia",
    svg: energia,
    fonte: "a passada nos dois sentidos, 60° e 240°",
    construcao: "setas com haste e cabeça, sem se sobrepor, centro vazio",
    fundo: "rosa",
    tinta: "roxo e ouro, marca em branco",
    usar: "gol, campeão, celebração, convite",
    evitar: "fundo de dados",
    marca: "principal-branca",
  },
  aquartelado: {
    nome: "Aquartelado",
    svg: aquartelado,
    fonte: "a perna de apoio e o braço, 75° e 15°",
    construcao: "leques de sete raios por canto, a 9° um do outro, encurtando e afinando até o centro",
    fundo: "ouro",
    tinta: "roxo e ciano, marca em roxo",
    usar: "ranking, carta ouro, troféu, pódio",
    evitar: "header e rodapé: pede altura",
    marca: "principal-roxa",
  },
}

function slice(svg: string) {
  return svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')
}

function Tile({ p, className, banda }: { p: Padrao; className?: string; banda?: boolean }) {
  return (
    <figure className={cn("group flex min-w-0 flex-col gap-3", className)}>
      <div className={cn("relative isolate overflow-hidden rounded-2xl", banda ? "aspect-[16/5]" : "aspect-video")}>
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: banda ? slice(p.svg) : p.svg }}
        />
        {p.marca === "simbolo-roxo" ? (
          <Logo svg={simbolo} className="absolute top-[7%] left-[7%] h-[34%] text-roxo" />
        ) : (
          <Logo
            svg={principal}
            className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", banda ? "h-[44%]" : "h-[26%]", p.marca === "principal-roxa" ? "text-roxo" : "text-white")}
          />
        )}
      </div>
      <figcaption className="grid gap-x-6 gap-y-1 text-sm leading-snug sm:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-1">
          <b className="font-display text-base font-semibold text-ink">
            {p.nome} <span className="font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">· sobre {p.fundo}</span>
          </b>
          <span className="text-fg-2">
            Vem de <b className="font-semibold text-ink">{p.fonte}</b>: {p.construcao}. {p.tinta}.
          </span>
        </div>
        <div className="flex flex-col gap-1 text-fg-2">
          <span>
            <b className="font-semibold text-success-ink">Usar em</b> {p.usar}
          </span>
          <span>
            <b className="font-semibold text-error-ink">Não usar</b> {p.evitar}
          </span>
        </div>
      </figcaption>
    </figure>
  )
}

function Modulo({ svg, nome, tamanho, cor }: { svg: string; nome: string; tamanho: number; cor: string }) {
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div className="aspect-[3/1] rounded-2xl" style={{ backgroundImage: url, backgroundSize: `${tamanho}px ${tamanho}px`, backgroundColor: cor }} aria-hidden="true" />
      <figcaption className="text-sm text-fg-2">
        <b className="font-display font-semibold text-ink">{nome}</b> · módulo de 400 × 400 repetido a {tamanho} px
      </figcaption>
    </figure>
  )
}

export function Padroes() {
  return (
    <Section
      id="padroes"
      n="02 · Padrões"
      titulo="Os ângulos da silhueta, em escala de fundo."
      lead="Os quatro padrões vêm do que a silhueta já tem: os ângulos, o corte e a bola. Nenhum é textura decorativa. A marca mora no campo vazio, nunca sobre as barras; o texto fica no campo liso e o padrão entra por máscara num lado só. Nunca mudam de cor fora da paleta e nunca levam degradê."
    >
      <div className="grid gap-x-4 gap-y-8 lg:grid-cols-3">
        <Tile p={PADROES.impulso} className="lg:col-span-2 lg:row-span-2" />
        <Tile p={PADROES.ritmo} />
        <Tile p={PADROES.energia} />
        <Tile p={PADROES.aquartelado} className="lg:col-span-3" banda />
      </div>

      <Bloco titulo="Módulos repetíveis" nota="Impulso e energia existem também como módulo de 400 × 400 sem emenda, para fundo de qualquer tamanho, camisa e adesivo. O módulo se usa de 200 a 800 px de lado; abaixo disso as barras viram ruído. Para fundo de carregamento, o módulo desliza ao longo do próprio ângulo (seção Movimento).">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Modulo svg={impulsoTile} nome="Impulso" tamanho={240} cor="#2E0B57" />
          <Modulo svg={energiaTile} nome="Energia" tamanho={200} cor="#FF3D8A" />
        </div>
      </Bloco>

      <Bloco titulo="Regras" nota="As composições 16:9 e os módulos estão em marca/padroes/, com as versões aplicadas (a marca já no lugar) e os PNG.">
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
      </Bloco>
    </Section>
  )
}
