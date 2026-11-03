import * as React from "react"
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  type ChartConfiguration,
  type Plugin,
  type ScriptableContext,
} from "chart.js"
import { cn } from "@meujogo/ui/lib/utils"

// Sem Tooltip e sem Legend registrados: série única não leva legenda, e a legenda das
// séries múltiplas é HTML, para seguir a tipografia e ser lida pelo leitor de tela.
Chart.register(LineController, LineElement, PointElement, BarController, BarElement, CategoryScale, LinearScale, Filler)

/* ------------------------------------------------------------------ */
/* Cores e fontes vindas dos tokens                                    */
/* ------------------------------------------------------------------ */

type Tokens = {
  tinta: string
  grade: string
  muted: string
  superficie: string
  fonteTexto: string
  fonteNumero: string
}

function ler(el: Element): Tokens {
  const css = getComputedStyle(el)
  const v = (nome: string, padrao: string) => css.getPropertyValue(nome).trim() || padrao
  return {
    // --mj-ink é o roxo no claro e vira branco no escuro; --mj-chart-1 não muda com o tema.
    tinta: v("--mj-ink", "#2E0B57"),
    grade: v("--mj-chart-grid", "#EEEAF2"),
    muted: v("--mj-muted", "#6B6076"),
    superficie: v("--mj-surface", "#FFFFFF"),
    fonteTexto: v("--mj-font-body", "Manrope, sans-serif"),
    fonteNumero: v("--mj-font-num", "Rajdhani, sans-serif"),
  }
}

function comAlfa(cor: string, alfa: number): string {
  const hex = cor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1]
    const n = parseInt(h, 16)
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`
  }
  const rgb = cor.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alfa})`
  return cor
}

const ALFAS_SERIE = [1, 0.45, 0.15]

/**
 * Cria o gráfico, refaz quando a configuração muda e quando o tema troca (classe no <html>),
 * e destrói no desmonte.
 */
function useGrafico(montar: (t: Tokens) => ChartConfiguration, chave: string) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const montarRef = React.useRef(montar)
  React.useLayoutEffect(() => {
    montarRef.current = montar
  })

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let grafico: Chart | null = null
    const desenhar = () => {
      grafico?.destroy()
      grafico = new Chart(canvas, montarRef.current(ler(canvas)))
    }
    desenhar()

    let vivo = true
    // Antes das fontes carregarem o canvas desenha com a fonte do sistema.
    document.fonts?.ready.then(() => vivo && desenhar())

    const observador = new MutationObserver(desenhar)
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })

    return () => {
      vivo = false
      observador.disconnect()
      grafico?.destroy()
    }
  }, [chave])

  return ref
}

/* ------------------------------------------------------------------ */
/* Linha                                                               */
/* ------------------------------------------------------------------ */

type Referencia = { valor: number; rotulo?: string }

type GraficoLinhaProps = {
  rotulos: string[]
  valores: number[]
  /** Descrição do gráfico para o leitor de tela. */
  rotuloAcessivel: string
  min?: number
  max?: number
  passo?: number
  /** Níveis em hairline tracejada, como a faixa de um tier. */
  referencias?: Referencia[]
  altura?: number
  maxRotulosX?: number
  className?: string
}

function GraficoLinha({
  rotulos,
  valores,
  rotuloAcessivel,
  min,
  max,
  passo,
  referencias = [],
  altura = 160,
  maxRotulosX = 5,
  className,
}: GraficoLinhaProps) {
  const chave = JSON.stringify([rotulos, valores, min, max, passo, referencias, maxRotulosX])
  const ref = useGrafico((t) => {
    const ultimo = valores.length - 1
    const linhasDeReferencia: Plugin<"line"> = {
      id: "mjReferencias",
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart
        ctx.save()
        for (const r of referencias) {
          const y = scales.y.getPixelForValue(r.valor)
          if (y < chartArea.top || y > chartArea.bottom) continue
          ctx.strokeStyle = comAlfa(t.tinta, 0.35)
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(chartArea.left, y)
          ctx.lineTo(chartArea.right, y)
          ctx.stroke()
          if (r.rotulo) {
            ctx.setLineDash([])
            ctx.fillStyle = t.muted
            ctx.font = `600 11px ${t.fonteTexto}`
            ctx.textAlign = "left"
            ctx.fillText(r.rotulo, chartArea.left + 4, y - 4)
          }
        }
        ctx.restore()
      },
    }
    return {
      type: "line",
      data: {
        labels: rotulos,
        datasets: [
          {
            data: valores,
            borderColor: t.tinta,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            backgroundColor: (c: ScriptableContext<"line">) => {
              const area = c.chart.chartArea
              if (!area) return comAlfa(t.tinta, 0.18)
              const g = c.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
              g.addColorStop(0, comAlfa(t.tinta, 0.18))
              g.addColorStop(1, comAlfa(t.tinta, 0))
              return g
            },
            pointRadius: valores.map((_, i) => (i === ultimo ? 6 : 0)),
            pointHoverRadius: valores.map((_, i) => (i === ultimo ? 6 : 0)),
            pointBackgroundColor: t.tinta,
            pointBorderColor: t.superficie,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        events: [],
        layout: { padding: { top: 8, right: 8 } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: t.muted, maxRotation: 0, autoSkip: true, maxTicksLimit: maxRotulosX, font: { family: t.fonteTexto, size: 12 } },
          },
          y: {
            min,
            max,
            grid: { color: t.grade },
            border: { display: false },
            ticks: { color: t.muted, stepSize: passo, callback: (v) => String(v), font: { family: t.fonteNumero, size: 12, weight: 600 } },
          },
        },
      },
      plugins: [linhasDeReferencia],
    } as ChartConfiguration
  }, chave)

  return (
    <div data-slot="grafico-linha" className={cn("relative w-full", className)} style={{ height: altura }}>
      <canvas ref={ref} role="img" aria-label={rotuloAcessivel} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Barras                                                              */
/* ------------------------------------------------------------------ */

type SerieBarras = {
  rotulo: string
  valores: number[]
  /** Texto curto da legenda, como "V" para vitórias. */
  abreviacao?: string
}

type GraficoBarrasProps = {
  rotulos: string[]
  /** Até três séries: roxo, roxo 45% e roxo 15%. */
  series: SerieBarras[]
  rotuloAcessivel: string
  horizontal?: boolean
  empilhado?: boolean
  max?: number
  /** Sem eixos, como a barra única de V/E/D da temporada. */
  eixos?: boolean
  /** Por padrão aparece só com mais de uma série. */
  legenda?: boolean
  altura?: number
  className?: string
}

function GraficoBarras({
  rotulos,
  series,
  rotuloAcessivel,
  horizontal = false,
  empilhado = false,
  max,
  eixos = true,
  legenda = series.length > 1,
  altura = 160,
  className,
}: GraficoBarrasProps) {
  const chave = JSON.stringify([rotulos, series, horizontal, empilhado, max, eixos])
  const ref = useGrafico((t) => {
    const indice = horizontal ? "y" : "x"
    const valor = horizontal ? "x" : "y"
    return {
      type: "bar",
      data: {
        labels: rotulos,
        datasets: series.map((s, i) => ({
          label: s.rotulo,
          data: s.valores,
          backgroundColor: comAlfa(t.tinta, ALFAS_SERIE[i] ?? 0.15),
          borderWidth: 0,
          borderRadius: empilhado ? 0 : 4,
          borderSkipped: false,
          barThickness: 20,
        })),
      },
      options: {
        indexAxis: indice,
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        events: [],
        scales: {
          [indice]: {
            stacked: empilhado,
            display: eixos,
            grid: { display: false },
            border: { display: false },
            ticks: { color: t.muted, maxRotation: 0, font: { family: t.fonteTexto, size: 12 } },
          },
          [valor]: {
            stacked: empilhado,
            display: eixos,
            beginAtZero: true,
            max,
            grid: { color: t.grade },
            border: { display: false },
            ticks: { color: t.muted, precision: 0, callback: (v) => String(v), font: { family: t.fonteNumero, size: 12, weight: 600 } },
          },
        },
      },
    } as ChartConfiguration
  }, chave)

  const unico = rotulos.length === 1
  return (
    <div data-slot="grafico-barras" className={className}>
      <div className="relative w-full" style={{ height: altura }}>
        <canvas ref={ref} role="img" aria-label={rotuloAcessivel} />
      </div>
      {legenda ? (
        <ul className="mt-1 flex flex-wrap items-center gap-4 text-xs font-medium text-fg-2">
          {series.map((s, i) => (
            <li key={s.rotulo} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn("size-2.5 rounded-[2px]", ["bg-ink", "bg-ink/45", "bg-ink/15"][i] ?? "bg-ink/15")}
              />
              {unico ? <span className="font-num text-sm font-bold text-foreground">{s.valores[0]}</span> : null}
              <abbr title={s.rotulo} className="no-underline">
                {s.abreviacao ?? s.rotulo}
              </abbr>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export { GraficoLinha, GraficoBarras }
export type { GraficoLinhaProps, GraficoBarrasProps, SerieBarras, Referencia }
