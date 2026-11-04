import * as React from "react"
import { Section, Block, Demo, Row } from "./_shared"
import { Button } from "@meujogo/ui/components/ui/button"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"
import symbolLogo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"

const D = / d="([^"]+)"/.exec(symbolLogo)?.[1] ?? ""
const cut = D.indexOf("Z") + 1
const BALL = D.slice(0, cut)
const FIGURE = D.slice(cut)

function Appear() {
  const [k, setK] = React.useState(0)
  return (
    <div className="flex items-center gap-6">
      <svg key={k} viewBox="0 0 256 256" className="h-24 w-24 text-ink" aria-hidden="true">
        <path d={FIGURE} fill="currentColor" className="mj-figure" />
        <path d={BALL} fill="currentColor" className="mj-ball" />
      </svg>
      <div className="flex flex-col gap-2">
        <p className="max-w-[32ch] text-sm text-fg-2">A figura entra com os braços abrindo, escala em X a partir do centro, 400 ms. A bola cai por último, de 20% acima, 150 ms.</p>
        <Button size="sm" variant="outline" onClick={() => setK((x) => x + 1)}>
          <Icon path={iconPath("refresh")} /> Repetir
        </Button>
      </div>
    </div>
  )
}

function RollNumber() {
  const [v, setV] = React.useState(1236)
  const [target, setTarget] = React.useState(1236)
  React.useEffect(() => {
    if (v === target) return
    const start = v
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 400)
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(start + (target - start) * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col leading-none">
        <span className="font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">ELO</span>
        <span className="font-num text-5xl font-bold text-ink tabular-nums">{v}</span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="max-w-[32ch] text-sm text-fg-2">O número rola até o valor novo em 400 ms, com curva de saída. Vale para ELO, placar e pontos.</p>
        <Button size="sm" variant="outline" onClick={() => setTarget((a) => (a === 1236 ? 1248 : 1236))}>
          <Icon path={iconPath("elo")} /> Partida encerrada
        </Button>
      </div>
    </div>
  )
}

export function Motion() {
  return (
    <Section
      id="motion"
      n="10 · Movimento"
      title="Firme, curto e na direção dos ângulos."
      lead="Nada quica, nada dá overshoot. 150 ms para responder, 250 ms para abrir e trocar, 400 ms para o que merece atenção: placar, sorteio, ELO. Entrar com a curva de saída, sair com a de entrada. Com prefers-reduced-motion, só opacidade."
    >
      <Demo>
        <Block title="Aparecer">
          <Appear />
        </Block>
        <Block title="Concluir">
          <RollNumber />
        </Block>
        <Block title="Interagir">
          <Row>
            <Button>Passe o mouse</Button>
            <Button variant="secondary">Clique e segure</Button>
          </Row>
          <p className="max-w-[40ch] text-sm text-fg-2">Botão afunda 1 px e escurece. 150 ms. Nada flutua, nada brilha.</p>
        </Block>
        <Block title="Transformar">
          <div className="mj-bars relative h-16 overflow-hidden rounded-lg bg-purple" aria-hidden="true" />
          <p className="max-w-[40ch] text-sm text-fg-2">As barras dos padrões deslizam ao longo do próprio ângulo, 15° aqui. Para fundo de carregamento e transição de tela.</p>
        </Block>
      </Demo>
      <div className="grid gap-3 text-sm text-fg-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <b className="font-num text-ink">fast · 150 ms</b>
          <p>hover, toggle, chip</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <b className="font-num text-ink">normal · 250 ms</b>
          <p>abrir card, trocar aba, folha</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <b className="font-num text-ink">slow · 400 ms</b>
          <p>placar, sorteio revelado, ELO</p>
        </div>
      </div>
    </Section>
  )
}
