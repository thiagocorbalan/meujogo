import { Section, Bloco, Logo, Code, Nunca } from "./_shared"
import principal from "@meujogo/brand/logo/meujogo-logo.svg?raw"
import simbolo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"
import pequeno from "@meujogo/brand/logo/meujogo-simbolo-pequeno.svg?raw"

const FUNDOS: { nome: string; bg: string; tinta: string; borda?: boolean }[] = [
  { nome: "Branco", bg: "#FFFFFF", tinta: "#2E0B57", borda: true },
  { nome: "Roxo", bg: "#2E0B57", tinta: "#FFFFFF" },
  { nome: "Ouro", bg: "#FFD700", tinta: "#2E0B57" },
  { nome: "Ciano", bg: "#22D3EE", tinta: "#2E0B57" },
  { nome: "Rosa", bg: "#FF3D8A", tinta: "#2E0B57" },
]

export function Marca() {
  return (
    <Section
      id="marca"
      n="01 · Marca"
      titulo="Uma tinta sobre fundos vivos."
      lead="Duas versões, e só duas: a principal, o Jogador entre as palavras, e o símbolo sozinho. Roxo ou branco, nunca a cor do fundo. Onde a principal não cabe, entra o símbolo; abaixo de 32 px, o corte pequeno. Os arquivos vêm de marca/logo/ e nunca se digitam."
    >
      <Bloco titulo="A principal nos cinco fundos">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FUNDOS.map((f) => (
            <figure
              key={f.nome}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-xl p-5"
              style={{ background: f.bg, color: f.tinta, boxShadow: f.borda ? "inset 0 0 0 1px var(--mj-line)" : undefined }}
            >
              <Logo svg={principal} className="h-10 w-auto sm:h-12" />
              <figcaption className="font-num text-xs font-bold tracking-[0.12em] uppercase opacity-80">{f.nome}</figcaption>
            </figure>
          ))}
        </div>
      </Bloco>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Bloco titulo="As duas versões e os mínimos" nota="A principal nunca fica abaixo de 48 px de altura: as letras têm 36% da altura e a 48 px ficam com 17 px de caixa alta. O símbolo vai de 32 px para cima. Abaixo disso, o corte pequeno fecha os cortes e engrossa o traço, para favicon, ícone de app e bordado.">
          <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
            <figure className="flex flex-col items-center justify-center gap-5 rounded-xl border border-border bg-card p-6 text-ink">
              <Logo svg={principal} className="h-24 sm:h-28" />
              <Logo svg={principal} className="h-12" />
              <figcaption className="text-xs text-muted-foreground">Principal · 48 px no mínimo</figcaption>
            </figure>
            <div className="grid gap-3">
              <figure className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-5 text-ink">
                <div className="flex items-end gap-6">
                  <Logo svg={simbolo} className="h-16" />
                  <Logo svg={simbolo} className="h-8" />
                </div>
                <figcaption className="text-xs text-muted-foreground">Símbolo · 64 e 32 px</figcaption>
              </figure>
              <figure className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-5 text-ink">
                <div className="flex items-end gap-5">
                  <Logo svg={pequeno} className="h-6" />
                  <Logo svg={pequeno} className="h-4" />
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-ouro text-roxo">
                    <Logo svg={pequeno} className="h-5" />
                  </span>
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-roxo text-white">
                    <Logo svg={pequeno} className="h-5" />
                  </span>
                </div>
                <figcaption className="text-xs text-muted-foreground">Corte pequeno · 24 e 16 px · ícone do app</figcaption>
              </figure>
            </div>
          </div>
        </Bloco>
        <Bloco titulo="Área de proteção" nota="O diâmetro da bola, medido na própria versão em uso, de cada lado. Nada entra nessa faixa: texto, borda, outro logo.">
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-border bg-card p-8 text-ink">
            <div className="relative inline-block border border-dashed border-ciano p-[10%]">
              <Logo svg={principal} className="h-14" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ciano px-2 font-num text-[11px] font-bold text-roxo">Ø bola</span>
            </div>
          </div>
        </Bloco>
      </div>

      <Bloco titulo="Nunca">
        <ul className="grid gap-2 sm:grid-cols-2">
          <Nunca>Compor o nome de outro jeito. Não existe versão em uma linha nem empilhada: ou a principal, ou o símbolo.</Nunca>
          <Nunca>Dar ao logo a cor do fundo, contorno, sombra ou gradiente.</Nunca>
          <Nunca>Digitar “Meu Jogo” numa fonte. O nome é desenho, em Outfit 700 vetorizada.</Nunca>
          <Nunca>Redesenhar a silhueta, separar a bola ou escrever outra palavra ao lado do Jogador.</Nunca>
          <Nunca>Usar a principal abaixo de 48 px ou o símbolo abaixo de 32 px: entra o corte pequeno.</Nunca>
          <Nunca>Colocar a marca sobre as barras dos padrões. Ela mora no campo vazio.</Nunca>
        </ul>
        <p className="text-sm text-fg-2">
          Regras completas em <Code>docs/meujogo/marca/identidade-visual.md</Code>.
        </p>
      </Bloco>
    </Section>
  )
}
