import { Section, Bloco, Code } from "./_shared"

const ESCALA: [string, string, string][] = [
  ["xs", "0.75rem", "12 px"],
  ["sm", "0.875rem", "14 px"],
  ["base", "1rem", "16 px"],
  ["lg", "1.125rem", "18 px"],
  ["xl", "1.25rem", "20 px"],
  ["2xl", "1.5rem", "24 px"],
  ["3xl", "1.875rem", "30 px"],
  ["4xl", "2.25rem", "36 px"],
  ["placar", "3.5rem", "56 px · só Rajdhani"],
]

export function Tipo() {
  return (
    <Section
      id="tipografia"
      n="04 · Tipografia"
      titulo="Lexend fala, Manrope explica, Rajdhani conta."
      lead="Três famílias, todas sob SIL OFL, e nenhuma delas no logo: o nome é Outfit 700 vetorizada e só existe como desenho. Lexend nos títulos e no nome do jogador, Manrope no texto, nos botões e nos formulários, Rajdhani em tudo o que é número de jogo."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
          <span className="font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Lexend · 500 600 700 · display</span>
          <p className="font-display text-4xl leading-tight font-bold text-ink">A pelada de toda semana, com cara de campeonato</p>
          <p className="font-display text-2xl font-semibold text-ink">Encerrar a partida?</p>
          <p className="font-display text-base font-medium text-fg-2">Lucas Andrade · Lateral</p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
          <span className="font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Manrope · 400 600 700 · texto</span>
          <p className="max-w-[40ch] text-base leading-relaxed text-foreground">
            O sorteio equilibra os times pelo ELO de cada jogador. Quem chega atrasado entra na fila e substitui alguém ou forma o próximo time.
          </p>
          <p className="text-sm font-semibold text-ink">Confirmar presença</p>
          <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">Rótulo em caixa alta · 0,08em</p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
          <span className="font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Rajdhani · 600 700 · números</span>
          <p className="font-num text-[3.5rem] leading-none font-bold text-ink">
            3 <span className="text-muted-foreground">×</span> 2
          </p>
          <p className="font-num text-3xl font-semibold text-fg-2">07:42</p>
          <p className="font-num text-xl font-bold text-ink">
            1248 <span className="text-base font-semibold text-success-ink">+12</span>
          </p>
        </div>
      </div>

      <Bloco titulo="Escala e entrelinha" nota="Base 16 px. Entrelinha 1,2 em títulos e números, 1,5 em texto, 1,7 em texto longo. Texto corrido com no máximo 65 caracteres por linha e nunca abaixo de 16 px no corpo.">
        <div className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:p-6">
          {ESCALA.map(([n, rem, px]) => (
            <div key={n} className="grid items-baseline gap-3 border-b border-border py-2 last:border-0 sm:grid-cols-[6rem_1fr_8rem]">
              <code className="font-num text-sm font-bold text-muted-foreground">{n}</code>
              <span className={n === "placar" ? "font-num font-bold text-ink" : "font-display font-semibold text-ink"} style={{ fontSize: rem, lineHeight: 1.2 }}>
                {n === "placar" ? "4 × 1" : "Meu Jogo"}
              </span>
              <span className="text-xs text-muted-foreground">{px}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-fg-2">
          No Tailwind: <Code>font-display</Code>, <Code>font-body</Code> (padrão) e <Code>font-num</Code>, com numerais tabulares no <Code>font-num</Code>.
        </p>
      </Bloco>
    </Section>
  )
}
