import * as React from "react"
import { Section, Bloco, Demo, Linha } from "./_shared"
import { Button } from "@meujogo/ui/components/ui/button"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"
import simbolo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"

const D = / d="([^"]+)"/.exec(simbolo)?.[1] ?? ""
const corte = D.indexOf("Z") + 1
const BOLA = D.slice(0, corte)
const FIGURA = D.slice(corte)

function Aparecer() {
  const [k, setK] = React.useState(0)
  return (
    <div className="flex items-center gap-6">
      <svg key={k} viewBox="0 0 256 256" className="h-24 w-24 text-ink" aria-hidden="true">
        <path d={FIGURA} fill="currentColor" className="mj-figura" />
        <path d={BOLA} fill="currentColor" className="mj-bola" />
      </svg>
      <div className="flex flex-col gap-2">
        <p className="max-w-[32ch] text-sm text-fg-2">A figura entra com os braços abrindo, escala em X a partir do centro, 400 ms. A bola cai por último, de 20% acima, 150 ms.</p>
        <Button size="sm" variant="outline" onClick={() => setK((x) => x + 1)}>
          <Icon path={icone("atualizar")} /> Repetir
        </Button>
      </div>
    </div>
  )
}

function Rolar() {
  const [v, setV] = React.useState(1236)
  const [alvo, setAlvo] = React.useState(1236)
  React.useEffect(() => {
    if (v === alvo) return
    const ini = v
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 400)
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(ini + (alvo - ini) * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo])
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col leading-none">
        <span className="font-num text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">ELO</span>
        <span className="font-num text-5xl font-bold text-ink tabular-nums">{v}</span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="max-w-[32ch] text-sm text-fg-2">O número rola até o valor novo em 400 ms, com curva de saída. Vale para ELO, placar e pontos.</p>
        <Button size="sm" variant="outline" onClick={() => setAlvo((a) => (a === 1236 ? 1248 : 1236))}>
          <Icon path={icone("elo")} /> Partida encerrada
        </Button>
      </div>
    </div>
  )
}

export function Movimento() {
  return (
    <Section
      id="movimento"
      n="10 · Movimento"
      titulo="Firme, curto e na direção dos ângulos."
      lead="Nada quica, nada dá overshoot. 150 ms para responder, 250 ms para abrir e trocar, 400 ms para o que merece atenção: placar, sorteio, ELO. Entrar com a curva de saída, sair com a de entrada. Com prefers-reduced-motion, só opacidade."
    >
      <Demo>
        <Bloco titulo="Aparecer">
          <Aparecer />
        </Bloco>
        <Bloco titulo="Concluir">
          <Rolar />
        </Bloco>
        <Bloco titulo="Interagir">
          <Linha>
            <Button>Passe o mouse</Button>
            <Button variant="secondary">Clique e segure</Button>
          </Linha>
          <p className="max-w-[40ch] text-sm text-fg-2">Botão afunda 1 px e escurece. 150 ms. Nada flutua, nada brilha.</p>
        </Bloco>
        <Bloco titulo="Transformar">
          <div className="mj-barras relative h-16 overflow-hidden rounded-lg bg-roxo" aria-hidden="true" />
          <p className="max-w-[40ch] text-sm text-fg-2">As barras dos padrões deslizam ao longo do próprio ângulo, 15° aqui. Para fundo de carregamento e transição de tela.</p>
        </Bloco>
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
