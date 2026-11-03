import { Section, Bloco, Code } from "./_shared"

const ESPACO = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
const RAIOS: [string, number, string][] = [
  ["sm", 6, "chip, badge quadrado, kbd"],
  ["md", 8, "item de menu"],
  ["lg", 10, "botão, campo, toggle"],
  ["xl", 14, "card, alerta"],
  ["2xl", 20, "dialog, folha"],
]

export function Espaco() {
  return (
    <Section
      id="espaco"
      n="05 · Espaço, raio, sombra"
      titulo="Base 4. Raio só nos contêineres. Quase nenhuma sombra."
      lead="A marca é chapada; profundidade vem da cor, não do brilho. As formas da identidade têm raio zero; o raio pertence aos contêineres da interface."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Bloco titulo="Espaço" nota="Alvo de toque mínimo 44 × 44 px. Gutter lateral de 16 px no mínimo.">
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            {ESPACO.map((v) => (
              <div key={v} className="flex items-center gap-3">
                <code className="w-8 font-num text-sm font-bold text-muted-foreground">{v}</code>
                <span className="h-3 rounded-sm bg-roxo" style={{ width: v * 3 }} />
              </div>
            ))}
          </div>
        </Bloco>
        <Bloco titulo="Raio" nota="Token --radius 10 px; o shadcn deriva os demais.">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            {RAIOS.map(([n, px, uso]) => (
              <div key={n} className="flex items-center gap-3">
                <span className="size-10 shrink-0 border-2 border-ink bg-muted" style={{ borderRadius: px }} />
                <div className="flex flex-col leading-tight">
                  <code className="font-num text-sm font-bold text-ink">
                    {n} · {px} px
                  </code>
                  <span className="text-xs text-muted-foreground">{uso}</span>
                </div>
              </div>
            ))}
          </div>
        </Bloco>
        <Bloco titulo="Sombra" nota="Card elevado: 0 1px 2px a 6% no claro, borda no escuro. O dialog é a única superfície com sombra forte. Nada brilha.">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5">
            <div className="rounded-xl border border-border bg-card p-4 text-sm">Card plano: só borda</div>
            <div className="rounded-xl bg-card p-4 text-sm shadow-sm ring-1 ring-border">Card elevado: borda e sombra sm</div>
            <div className="rounded-2xl bg-card p-4 text-sm shadow-dialog ring-1 ring-border">Dialog: a única sombra forte</div>
          </div>
          <p className="text-sm text-fg-2">
            Tokens: <Code>shadow-sm</Code> e <Code>shadow-dialog</Code>.
          </p>
        </Bloco>
      </div>
    </Section>
  )
}
