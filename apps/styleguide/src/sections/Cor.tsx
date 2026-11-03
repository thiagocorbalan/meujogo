import { Section, Bloco, Sw, Sw2, Demo, Linha, Code } from "./_shared"
import { Badge } from "@meujogo/ui/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meujogo/ui/components/ui/table"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"

const PARES: [string, string, string, string][] = [
  ["#1C1426", "#FFFFFF", "17,84", "Texto no claro"],
  ["#4A3F57", "#FFFFFF", "9,81", "Texto secundário"],
  ["#6B6076", "#FFFFFF", "5,90", "Legenda no claro"],
  ["#EFEAF4", "#14101A", "15,86", "Texto no escuro"],
  ["#A79CB3", "#1F1829", "6,59", "Legenda em card escuro"],
  ["#FFFFFF", "#2E0B57", "16,13", "Botão primário e herói no claro"],
  ["#2E0B57", "#FFFFFF", "16,13", "Botão primário no escuro, CTA branco no herói"],
  ["#2E0B57", "#EAE6EF", "13,11", "Roxo sobre roxo 10%: secundário, chip e aba não selecionados"],
  ["#2E0B57", "#F4F1F7", "14,42", "Roxo sobre roxo 6%: linha \"eu\", item em foco no menu"],
  ["#FFFFFF", "#DC2233", "4,86", "Selo Ao vivo: texto branco em negrito sobre o vermelho"],
  ["#FFFFFF", "#1C1426", "17,84", "Texto do snackbar de desfazer"],
  ["#C9B6EE", "#1C1426", "9,69", "Ação Desfazer em lavanda no snackbar"],
  ["#C4175F", "#FFFFFF", "5,78", "Rosa-tinta: erro e ação destrutiva no claro"],
  ["#0B7A36", "#FFFFFF", "5,45", "Verde-tinta: texto de sucesso no claro"],
  ["#7A5C00", "#FFFFFF", "6,25", "Ouro-tinta: texto de 1º lugar no claro"],
  ["#FF3D8A", "#14101A", "5,62", "Rosa como texto de erro no escuro"],
  ["#18DC60", "#14101A", "10,23", "Verde como ícone de sucesso no escuro"],
  ["#FFD700", "#14101A", "13,38", "Ouro como ícone de 1º lugar no escuro"],
]

const PAPEIS: { nome: string; hex: string; papel: string; nunca: string }[] = [
  { nome: "Ouro", hex: "#FFD700", papel: "1º lugar, vitória, campeão da noite, tier ouro: coroa, ponto de 1º, anel do campeão, carta do título", nunca: "Navegação, menu, botão, alerta" },
  { nome: "Ciano", hex: "#22D3EE", papel: "Anel de foco", nunca: "Dado, ELO, estatística, ao vivo" },
  { nome: "Verde", hex: "#18DC60", papel: "Confirmado e sucesso, como ícone ou ponto", nunca: "Preenchimento maior que um chip" },
  { nome: "Rosa", hex: "#FF3D8A", papel: "Erro e ação destrutiva", nunca: "Celebração dentro do app" },
  { nome: "Vermelho ao vivo", hex: "#DC2233", papel: "Só o selo Ao vivo: pílula cheia, texto branco, ponto que pulsa", nunca: "Erro, qualquer outro lugar" },
]

function Proporcao() {
  const faixas: [string, string, string, string][] = [
    ["80%", "Neutro", "Branco sobre #F6F4F8: superfícies, texto, hairlines", "bg-card ring-1 ring-line"],
    ["15–20%", "Roxo", "Herói, ação principal, seleção, item ativo, títulos de seção, links", "bg-roxo"],
    ["≤ 5%", "Cor viva", "Ponto, chip, ícone, anel ou um número. No máximo 2 por tela e 1 por bloco", "bg-ouro"],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-10 w-full overflow-hidden rounded-full ring-1 ring-line" aria-hidden="true">
        <span className="bg-card" style={{ flex: 80 }} />
        <span className="bg-roxo" style={{ flex: 17 }} />
        <span className="bg-ouro" style={{ flex: 1 }} />
        <span className="bg-verde" style={{ flex: 1 }} />
        <span className="bg-rosa" style={{ flex: 1 }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {faixas.map(([pct, nome, uso, cor]) => (
          <div key={nome} className="flex flex-col gap-1 rounded-xl bg-card p-4">
            <span className="flex items-center gap-2">
              <span className={"size-3 rounded-full " + cor} />
              <b className="font-num text-2xl font-bold text-ink">{pct}</b>
              <span className="text-sm font-semibold text-fg-2">{nome}</span>
            </span>
            <span className="text-sm leading-snug text-fg-2">{uso}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Cor() {
  return (
    <Section
      id="cor"
      n="03 · Cor"
      titulo="O roxo conduz. A cor viva é sinal."
      lead="Toda tela do app é quase toda neutra, conduzida pelo roxo, com a cor viva em peça pequena e com um papel só. A variedade de cor vem do conteúdo: fotos, escudos e a cor do colete. Os neutros carregam um pouco de roxo."
    >
      <Bloco titulo="Marca">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Sw nome="Roxo" hex="#2E0B57" texto="#FFFFFF" nota="Conduz: herói, ação principal, seleção, item ativo, títulos" />
          <Sw nome="Ouro" hex="#FFD700" texto="#2E0B57" nota="1º lugar, vitória e campeão. Só em peça pequena" />
          <Sw nome="Ciano" hex="#22D3EE" texto="#2E0B57" nota="Só o anel de foco" />
          <Sw nome="Rosa" hex="#FF3D8A" texto="#2E0B57" nota="Erro e ação destrutiva. Celebração só nas imagens de compartilhar" />
          <Sw nome="Verde" hex="#18DC60" texto="#2E0B57" nota="Confirmado e sucesso, como ícone ou ponto" />
        </div>
      </Bloco>

      <Bloco titulo="Neutros, com viés de roxo" nota="Cinza puro parece acidental ao lado do roxo. Claro à esquerda, escuro à direita.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <Sw2 nome="bg" claro="#F6F4F8" escuro="#14101A" nota="Fundo da página" />
          <Sw2 nome="surface" claro="#FFFFFF" escuro="#1F1829" nota="Card, folha, modal" />
          <Sw2 nome="surface-2" claro="#F3F1F5" escuro="#2A2136" nota="Campo preenchido, chip neutro" />
          <Sw2 nome="line" claro="#D9D3E0" escuro="#342A40" nota="Borda, divisor" />
          <Sw2 nome="fg" claro="#1C1426" escuro="#EFEAF4" nota="Texto" />
          <Sw2 nome="fg-2" claro="#4A3F57" escuro="#C9BFD4" nota="Texto secundário" />
          <Sw2 nome="muted" claro="#6B6076" escuro="#A79CB3" nota="Legenda, placeholder" />
        </div>
      </Bloco>

      <Bloco titulo="Tons de roxo" nota="Sobre o branco, os tons do próprio roxo entram no lugar de uma matiz nova. A lavanda é a ação no snackbar escuro e o ligado do switch no tema escuro.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Sw nome="Roxo hover" hex="#4A1E85" texto="#FFFFFF" nota="Hover e pressionado do primário" />
          <Sw nome="Roxo 10%" hex="#EAE6EF" texto="#2E0B57" nota="Secundário, chip e aba não selecionados, trilho" />
          <Sw nome="Roxo 6%" hex="#F4F1F7" texto="#2E0B57" nota="Linha eu, linha selecionada, hover, foco no menu" />
          <Sw nome="Lavanda" hex="#C9B6EE" texto="#2E0B57" nota="Ação no snackbar; switch ligado no escuro" />
          <Sw nome="Snackbar" hex="#1C1426" texto="#C9B6EE" nota="Fundo do snackbar de desfazer" />
        </div>
      </Bloco>

      <Bloco titulo="A regra: 80, 15–20, no máximo 5" nota="Cerca de 80% neutro, 15–20% roxo e no máximo 5% de cor viva. Um herói roxo por tela. Sem sombra (só dialog e folha), sem vidro, sem desfoque, sem faixa colorida em card, sem ícone gigante esmaecido.">
        <Proporcao />
      </Bloco>

      <Bloco titulo="Um papel por cor viva" nota="Chips de estado, alertas e toasts são neutros, com a cor só no ícone ou no ponto e o estado escrito. O selo Ao vivo conta como uma das duas cores vivas da tela.">
        <div className="overflow-hidden rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Papel único</TableHead>
                <TableHead>Nunca</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAPEIS.map((p) => (
                <TableRow key={p.nome}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2.5">
                      <span className="size-3 shrink-0 rounded-full" style={{ background: p.hex }} />
                      <span className="flex flex-col">
                        <b className="text-sm text-foreground">{p.nome}</b>
                        <code className="font-num text-sm font-semibold text-muted-foreground">{p.hex}</code>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="min-w-56 whitespace-normal text-fg-2">{p.papel}</TableCell>
                  <TableCell className="min-w-40 whitespace-normal text-fg-2">{p.nunca}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Demo>
          <Linha>
            <Badge variant="success">Confirmado</Badge>
            <Badge variant="destructive">Faltou</Badge>
            <Badge variant="warning">
              <Icon path={icone("sem-resposta")} /> Pendente
            </Badge>
            <Badge variant="live">Ao vivo</Badge>
          </Linha>
          <ul className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            <li className="flex items-center gap-2">
              <Icon path={icone("sucesso")} className="size-5 text-success-ink" /> Presença confirmada para quinta
            </li>
            <li className="flex items-center gap-2">
              <Icon path={icone("campeao")} className="size-5 text-tier-ouro" /> Lucas, campeão da noite
            </li>
            <li className="flex items-center gap-2 text-error-ink">
              <Icon path={icone("erro")} className="size-5" /> Código inválido ou vencido
            </li>
          </ul>
        </Demo>
        <p className="max-w-[70ch] text-sm leading-relaxed text-fg-2">
          Ouro, ciano e verde colapsam no mesmo cinza em escala de cinza: <b className="text-ink">nunca diferenciar dois estados só pela cor</b>. O estado vai escrito, sempre. A cor do colete aparece como o ícone <Code>tshirt-crew</Code> na cor real, nunca como preenchimento.
        </p>
      </Bloco>

      <Bloco titulo="Tiers das cartas" nota="Cor da carta e do perfil; nos chips, só o ponto. Prata, ouro e diamante colapsam no cinza, então o nome do tier vai escrito. As cartas em si são desenhadas numa sessão própria.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Sw nome="Bronze" hex="#C8803C" texto="#2E0B57" nota="Roxo a 5,08:1. Branco só em componente" />
          <Sw nome="Prata" hex="#C9C5D1" texto="#2E0B57" nota="Roxo a 9,52:1, com o viés de roxo dos neutros" />
          <Sw nome="Ouro" hex="#FFD700" texto="#2E0B57" nota="O ouro da marca" />
          <Sw nome="Diamante" hex="#22D3EE" texto="#2E0B57" nota="O ciano da marca" />
        </div>
        <Linha>
          <Badge variant="bronze">Bronze</Badge>
          <Badge variant="prata">Prata</Badge>
          <Badge variant="ouro">Ouro</Badge>
          <Badge variant="diamante">Diamante</Badge>
        </Linha>
      </Bloco>

      <Bloco titulo="Pares medidos" nota="WCAG 2.1, medidos com o validador da skill de marca. Texto normal pede 4,5:1; texto grande e componente, 3:1. Cada par diz onde a cor pode ir.">
        <div className="overflow-hidden rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Par</TableHead>
                <TableHead className="text-right">Razão</TableHead>
                <TableHead>Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PARES.map(([fg, bg, r, uso]) => (
                <TableRow key={fg + bg + uso}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-7 w-10 items-center justify-center rounded-md border border-border/60 font-display text-sm font-bold" style={{ background: bg, color: fg }}>
                        Aa
                      </span>
                      <code className="font-num text-sm font-semibold">
                        {fg} / {bg}
                      </code>
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-num text-base font-bold">{r}:1</TableCell>
                  <TableCell className="whitespace-normal text-fg-2">{uso}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-fg-2">
          Tokens e a tabela completa em <Code>docs/meujogo/marca/design-tokens.md</Code>.
        </p>
      </Bloco>
    </Section>
  )
}
