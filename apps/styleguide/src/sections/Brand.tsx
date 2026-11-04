import { Section, Block, Logo, Code, Never } from "./_shared"
import primaryLogo from "@meujogo/brand/logo/meujogo-logo.svg?raw"
import symbolLogo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"
import smallLogo from "@meujogo/brand/logo/meujogo-simbolo-pequeno.svg?raw"

const BACKGROUNDS: { name: string; bg: string; ink: string; border?: boolean }[] = [
  { name: "Branco", bg: "#FFFFFF", ink: "#2E0B57", border: true },
  { name: "Roxo", bg: "#2E0B57", ink: "#FFFFFF" },
  { name: "Ouro", bg: "#FFD700", ink: "#2E0B57" },
  { name: "Ciano", bg: "#22D3EE", ink: "#2E0B57" },
  { name: "Rosa", bg: "#FF3D8A", ink: "#2E0B57" },
]

export function Brand() {
  return (
    <Section
      id="brand"
      n="01 · Marca"
      title="Uma tinta sobre fundos vivos."
      lead="Duas versões, e só duas: a principal, o Jogador entre as palavras, e o símbolo sozinho. Roxo ou branco, nunca a cor do fundo. Onde a principal não cabe, entra o símbolo; abaixo de 32 px, o corte pequeno. Os arquivos vêm de marca/logo/ e nunca se digitam."
    >
      <Block title="A principal nos cinco fundos">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BACKGROUNDS.map((f) => (
            <figure
              key={f.name}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-xl p-5"
              style={{ background: f.bg, color: f.ink, boxShadow: f.border ? "inset 0 0 0 1px var(--mj-line)" : undefined }}
            >
              <Logo svg={primaryLogo} className="h-10 w-auto sm:h-12" />
              <figcaption className="font-num text-xs font-bold tracking-[0.12em] uppercase opacity-80">{f.name}</figcaption>
            </figure>
          ))}
        </div>
      </Block>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Block title="As duas versões e os mínimos" note="A principal nunca fica abaixo de 48 px de altura: as letras têm 36% da altura e a 48 px ficam com 17 px de caixa alta. O símbolo vai de 32 px para cima. Abaixo disso, o corte pequeno fecha os cortes e engrossa o traço, para favicon, ícone de app e bordado.">
          <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
            <figure className="flex flex-col items-center justify-center gap-5 rounded-xl border border-border bg-card p-6 text-ink">
              <Logo svg={primaryLogo} className="h-24 sm:h-28" />
              <Logo svg={primaryLogo} className="h-12" />
              <figcaption className="text-xs text-muted-foreground">Principal · 48 px no mínimo</figcaption>
            </figure>
            <div className="grid gap-3">
              <figure className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-5 text-ink">
                <div className="flex items-end gap-6">
                  <Logo svg={symbolLogo} className="h-16" />
                  <Logo svg={symbolLogo} className="h-8" />
                </div>
                <figcaption className="text-xs text-muted-foreground">Símbolo · 64 e 32 px</figcaption>
              </figure>
              <figure className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-5 text-ink">
                <div className="flex items-end gap-5">
                  <Logo svg={smallLogo} className="h-6" />
                  <Logo svg={smallLogo} className="h-4" />
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-gold text-purple">
                    <Logo svg={smallLogo} className="h-5" />
                  </span>
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-purple text-white">
                    <Logo svg={smallLogo} className="h-5" />
                  </span>
                </div>
                <figcaption className="text-xs text-muted-foreground">Corte pequeno · 24 e 16 px · ícone do app</figcaption>
              </figure>
            </div>
          </div>
        </Block>
        <Block title="Área de proteção" note="O diâmetro da bola, medido na própria versão em uso, de cada lado. Nada entra nessa faixa: texto, borda, outro logo.">
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-border bg-card p-8 text-ink">
            <div className="relative inline-block border border-dashed border-cyan p-[10%]">
              <Logo svg={primaryLogo} className="h-14" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan px-2 font-num text-[11px] font-bold text-purple">Ø bola</span>
            </div>
          </div>
        </Block>
      </div>

      <Block title="Nunca">
        <ul className="grid gap-2 sm:grid-cols-2">
          <Never>Compor o nome de outro jeito. Não existe versão em uma linha nem empilhada: ou a principal, ou o símbolo.</Never>
          <Never>Dar ao logo a cor do fundo, contorno, sombra ou gradiente.</Never>
          <Never>Digitar “Meu Jogo” numa fonte. O nome é desenho, em Outfit 700 vetorizada.</Never>
          <Never>Redesenhar a silhueta, separar a bola ou escrever outra palavra ao lado do Jogador.</Never>
          <Never>Usar a principal abaixo de 48 px ou o símbolo abaixo de 32 px: entra o corte pequeno.</Never>
          <Never>Colocar a marca sobre as barras dos padrões. Ela mora no campo vazio.</Never>
        </ul>
        <p className="text-sm text-fg-2">
          Regras completas em <Code>docs/meujogo/marca/identidade-visual.md</Code>.
        </p>
      </Block>
    </Section>
  )
}
