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
  ink: string
  grid: string
  muted: string
  surface: string
  bodyFont: string
  numFont: string
}

function readTokens(el: Element): Tokens {
  const css = getComputedStyle(el)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    // --mj-ink é o roxo no claro e vira branco no escuro; --mj-chart-1 não muda com o tema.
    ink: v("--mj-ink", "#2E0B57"),
    grid: v("--mj-chart-grid", "#EEEAF2"),
    muted: v("--mj-muted", "#6B6076"),
    surface: v("--mj-surface", "#FFFFFF"),
    bodyFont: v("--mj-font-body", "Manrope, sans-serif"),
    numFont: v("--mj-font-num", "Rajdhani, sans-serif"),
  }
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1]
    const n = parseInt(h, 16)
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
  }
  const rgb = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`
  return color
}

const SERIES_ALPHAS = [1, 0.45, 0.15]

/**
 * Cria o gráfico, refaz quando a configuração muda e quando o tema troca (classe no <html>),
 * e destrói no desmonte.
 */
function useChart(build: (t: Tokens) => ChartConfiguration, key: string) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const buildRef = React.useRef(build)
  React.useLayoutEffect(() => {
    buildRef.current = build
  })

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let chart: Chart | null = null
    const draw = () => {
      chart?.destroy()
      chart = new Chart(canvas, buildRef.current(readTokens(canvas)))
    }
    draw()

    let alive = true
    // Antes das fontes carregarem o canvas desenha com a fonte do sistema.
    document.fonts?.ready.then(() => alive && draw())

    const observer = new MutationObserver(draw)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })

    return () => {
      alive = false
      observer.disconnect()
      chart?.destroy()
    }
  }, [key])

  return ref
}

/* ------------------------------------------------------------------ */
/* Linha                                                               */
/* ------------------------------------------------------------------ */

type ChartReference = { value: number; label?: string }

type LineChartProps = {
  labels: string[]
  values: number[]
  /** Descrição do gráfico para o leitor de tela. */
  accessibleLabel: string
  min?: number
  max?: number
  step?: number
  /** Níveis em hairline tracejada, como a faixa de um tier. */
  references?: ChartReference[]
  height?: number
  maxXLabels?: number
  className?: string
}

function LineChart({
  labels,
  values,
  accessibleLabel,
  min,
  max,
  step,
  references = [],
  height = 160,
  maxXLabels = 5,
  className,
}: LineChartProps) {
  const key = JSON.stringify([labels, values, min, max, step, references, maxXLabels])
  const ref = useChart((t) => {
    const last = values.length - 1
    const referenceLines: Plugin<"line"> = {
      id: "mjReferences",
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart
        ctx.save()
        for (const r of references) {
          const y = scales.y.getPixelForValue(r.value)
          if (y < chartArea.top || y > chartArea.bottom) continue
          ctx.strokeStyle = withAlpha(t.ink, 0.35)
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(chartArea.left, y)
          ctx.lineTo(chartArea.right, y)
          ctx.stroke()
          if (r.label) {
            ctx.setLineDash([])
            ctx.fillStyle = t.muted
            ctx.font = `600 11px ${t.bodyFont}`
            ctx.textAlign = "left"
            ctx.fillText(r.label, chartArea.left + 4, y - 4)
          }
        }
        ctx.restore()
      },
    }
    return {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: t.ink,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            backgroundColor: (c: ScriptableContext<"line">) => {
              const area = c.chart.chartArea
              if (!area) return withAlpha(t.ink, 0.18)
              const g = c.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
              g.addColorStop(0, withAlpha(t.ink, 0.18))
              g.addColorStop(1, withAlpha(t.ink, 0))
              return g
            },
            pointRadius: values.map((_, i) => (i === last ? 6 : 0)),
            pointHoverRadius: values.map((_, i) => (i === last ? 6 : 0)),
            pointBackgroundColor: t.ink,
            pointBorderColor: t.surface,
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
            ticks: { color: t.muted, maxRotation: 0, autoSkip: true, maxTicksLimit: maxXLabels, font: { family: t.bodyFont, size: 12 } },
          },
          y: {
            min,
            max,
            grid: { color: t.grid },
            border: { display: false },
            ticks: { color: t.muted, stepSize: step, callback: (v) => String(v), font: { family: t.numFont, size: 12, weight: 600 } },
          },
        },
      },
      plugins: [referenceLines],
    } as ChartConfiguration
  }, key)

  return (
    <div data-slot="line-chart" className={cn("relative w-full", className)} style={{ height }}>
      <canvas ref={ref} role="img" aria-label={accessibleLabel} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Barras                                                              */
/* ------------------------------------------------------------------ */

type BarSeries = {
  label: string
  values: number[]
  /** Texto curto da legenda, como "V" para vitórias. */
  abbreviation?: string
}

type BarChartProps = {
  labels: string[]
  /** Até três séries: roxo, roxo 45% e roxo 15%. */
  series: BarSeries[]
  accessibleLabel: string
  horizontal?: boolean
  stacked?: boolean
  max?: number
  /** Sem eixos, como a barra única de V/E/D da temporada. */
  axes?: boolean
  /** Por padrão aparece só com mais de uma série. */
  legend?: boolean
  height?: number
  className?: string
}

function BarChart({
  labels,
  series,
  accessibleLabel,
  horizontal = false,
  stacked = false,
  max,
  axes = true,
  legend = series.length > 1,
  height = 160,
  className,
}: BarChartProps) {
  const key = JSON.stringify([labels, series, horizontal, stacked, max, axes])
  const ref = useChart((t) => {
    const indexAxis = horizontal ? "y" : "x"
    const valueAxis = horizontal ? "x" : "y"
    return {
      type: "bar",
      data: {
        labels,
        datasets: series.map((s, i) => ({
          label: s.label,
          data: s.values,
          backgroundColor: withAlpha(t.ink, SERIES_ALPHAS[i] ?? 0.15),
          borderWidth: 0,
          borderRadius: stacked ? 0 : 4,
          borderSkipped: false,
          barThickness: 20,
        })),
      },
      options: {
        indexAxis,
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        events: [],
        scales: {
          [indexAxis]: {
            stacked,
            display: axes,
            grid: { display: false },
            border: { display: false },
            ticks: { color: t.muted, maxRotation: 0, font: { family: t.bodyFont, size: 12 } },
          },
          [valueAxis]: {
            stacked,
            display: axes,
            beginAtZero: true,
            max,
            grid: { color: t.grid },
            border: { display: false },
            ticks: { color: t.muted, precision: 0, callback: (v) => String(v), font: { family: t.numFont, size: 12, weight: 600 } },
          },
        },
      },
    } as ChartConfiguration
  }, key)

  const single = labels.length === 1
  return (
    <div data-slot="bar-chart" className={className}>
      <div className="relative w-full" style={{ height }}>
        <canvas ref={ref} role="img" aria-label={accessibleLabel} />
      </div>
      {legend ? (
        <ul className="mt-1 flex flex-wrap items-center gap-4 text-xs font-medium text-fg-2">
          {series.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn("size-2.5 rounded-[2px]", ["bg-ink", "bg-ink/45", "bg-ink/15"][i] ?? "bg-ink/15")}
              />
              {single ? <span className="font-num text-sm font-bold text-foreground">{s.values[0]}</span> : null}
              <abbr title={s.label} className="no-underline">
                {s.abbreviation ?? s.label}
              </abbr>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export { LineChart, BarChart }
export type { LineChartProps, BarChartProps, BarSeries, ChartReference }
