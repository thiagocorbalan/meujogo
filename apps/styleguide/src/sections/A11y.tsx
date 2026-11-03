import { Section } from "./_shared"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"

const ITENS: [string, string][] = [
  ["Contraste medido", "Todo par de texto da tabela foi medido. Os estados usam a paleta da marca, e por isso cada um tem a versão tinta para texto corrido no claro."],
  ["Foco visível", "Anel de 3 px na cor de foco: ciano no claro, ouro no escuro. Vem do shadcn em todos os componentes. Tudo acionável por teclado na ordem de leitura."],
  ["Nunca só a cor", "Ouro, ciano e verde colapsam no cinza. Estado, tier e time levam ícone, texto ou posição junto."],
  ["Toque e texto", "Alvo de 44 px no mínimo, botão padrão com 44, campo com 44. Corpo com 16 px e entrelinha 1,5. Texto nunca dentro de imagem."],
  ["Ícone com nome", "Sozinho, o ícone leva aria-label; com texto, é aria-hidden. O componente Icon já faz isso pelo atributo title."],
  ["Movimento opcional", "Com prefers-reduced-motion, animações e transições somem; só a opacidade fica."],
]

export function A11y() {
  return (
    <Section id="acessibilidade" n="11 · Acessibilidade" titulo="O mínimo, sempre.">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITENS.map(([t, d]) => (
          <li key={t} className="flex gap-3 rounded-xl border border-border bg-card p-4">
            <Icon path={icone("sucesso")} className="mt-0.5 size-5 shrink-0 text-success-ink" />
            <span className="flex flex-col gap-1">
              <b className="font-display text-base font-semibold text-ink">{t}</b>
              <span className="text-sm leading-relaxed text-fg-2">{d}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
